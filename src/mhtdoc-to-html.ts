import AdmZip from "adm-zip";
import { DocumentPart } from "./document-part";
import { JSDOM } from "jsdom";
import assert from "assert";

export class MhtDocToHtml {
  // afchunk.mht 文件的 Buffer
  private readonly _buffer: Buffer;

  // afchunk.mht 内容缓存
  private _linesCache: string[] | undefined = undefined;

  // 当前读取的行数
  private _lineIndex = -1;

  // 分隔符
  private _boundary: string = "--";

  constructor(buffer: Buffer) {
    if (!buffer) {
      throw new Error("'buffer' is undefuned.");
    }

    // 提取 afchunk.mht 文件的 Buffer
    this._buffer = this.extractMhtBuffer(buffer);
  }

  private extractMhtBuffer(buffer: Buffer): Buffer {
    let zip: AdmZip;

    try {
      zip = new AdmZip(buffer);
    } catch (e) {
      throw new Error("Unable to decompress.");
    }

    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.entryName === "word/afchunk.mht") {
        return entry.getData();
      }
    }

    throw new Error("'afchunk.mht' not found.");
  }

  async convertToHtml(
    imageConvert?: (imageBase64Buffer: Buffer) => Promise<string>
  ): Promise<string> {
    const doc = await this.convertToDocument(imageConvert);
    if (!doc) {
      return "";
    }

    return doc.body.innerHTML;
  }

  async convertToDocument(
    imageConvert?: (imageBase64Buffer: Buffer) => Promise<string>
  ): Promise<Document | undefined> {
    this.reset();

    const documentParts = this.parse();

    if (documentParts.length <= 0) {
      return undefined;
    }

    const htmlPart = documentParts.find((p) =>
      p.contentType.startsWith("text/html")
    );
    assert(htmlPart);

    const html = htmlPart.data.replace(/3D*/g, "");
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    doc.querySelectorAll("img").forEach(async (img) => {
      const imgPart = documentParts.find((p) => p.contentLocation === img.src);
      assert(imgPart);

      const imgBase64Str = imgPart.data;

      if (imageConvert) {
        const imageBuffer = Buffer.from(imgBase64Str, "base64");
        img.src = await imageConvert(imageBuffer);
      } else {
        img.src = `data:image/jpg;base64,${imgBase64Str}`;
      }
    });

    return doc;
  }

  private parse(): DocumentPart[] {
    const documentParts: DocumentPart[] = [];

    let contentType = "";
    let contentTransferEncoding = "";
    let contentLocation = "";
    let data: string[] = [];

    const pushAndCreate = (): void => {
      documentParts.push({
        contentType: contentType,
        contentTransferEncoding: contentTransferEncoding,
        contentLocation: contentLocation,
        data: data.join(""),
      });
      contentType = "";
      contentTransferEncoding = "";
      contentLocation = "";
      data = [];
    };

    const parseLine = (line: string): void => {
      let keyValue = this.getValueByKey("MIME-Version", line);
      if (keyValue) {
        if (keyValue !== "1.0") {
          throw new Error("Unsupported version.");
        }
        return;
      }

      keyValue = this.getValueByKey("    type", line);
      if (keyValue) {
        return;
      }

      keyValue = this.getValueByKey("    boundary", line);
      if (keyValue) {
        this._boundary = `--${keyValue.trim()}`;
        return;
      }

      // 已经读取到分隔符，并且当前行不是空字符
      if (this._boundary !== "--") {
        keyValue = this.getValueByKey("Content-Type", line);
        if (keyValue) {
          contentType = keyValue;
          return;
        }

        keyValue = this.getValueByKey("    charset", line);
        if (keyValue) {
          contentType += ` charset="${keyValue}"`;
          return;
        }

        keyValue = this.getValueByKey("Content-Transfer-Encoding", line);
        if (keyValue) {
          contentTransferEncoding = keyValue;
          return;
        }

        keyValue = this.getValueByKey("Content-Location", line);
        if (keyValue) {
          contentLocation = keyValue;
          return;
        }

        // 读取到内容
        data.push(line.trim());
      }
    };

    while (this.read()) {
      const line = this.value;

      if (!line) {
        continue;
      }

      // 判断是否读取到开始分隔符
      if (line === this._boundary) {
        pushAndCreate();
        continue;
      }

      // 判断是否读取到结束分隔符
      if (line === `${this._boundary}--`) {
        pushAndCreate();
        this._boundary = "--";
        continue;
      }

      parseLine(line);
    }

    documentParts.shift();

    return documentParts;
  }

  private getValueByKey(key: string, line: string): string | null {
    const innerGetValue = function () {
      if (line.substr(0, index).toLowerCase() != key.toLowerCase()) {
        return null;
      }

      return line.substr(index + 1).trim();
    };

    // 解析 'MIME-Version: 1.0' 格式的行
    let index = line.indexOf(":");

    if (index > -1) {
      return innerGetValue();
    }

    // 解析 'boundary="----=mhtDocumentPart"' 格式的行
    index = line.indexOf("=");

    if (index > -1) {
      const value = innerGetValue();

      return value?.replace(/^"+|\"+$/g, "") ?? null;
    }

    return null;
  }

  private read(): boolean {
    this._linesCache ??= this.extractLines(this._buffer);

    if (
      this._linesCache.length <= 0 ||
      this._lineIndex >= this._linesCache.length - 1
    ) {
      return false;
    }

    this._lineIndex++;

    return true;
  }

  private get value(): string {
    if (!this._linesCache || this._lineIndex >= this._linesCache.length) {
      throw new Error("Trying to read beyond end of stream.");
    }

    return this._linesCache[this._lineIndex];
  }

  private extractLines(
    buffer: Buffer,
    options?: BufferEncoding | undefined
  ): string[] {
    return buffer.toString(options ?? "utf-8").split(/(?:\r\n|\r|\n)/g);
  }

  private reset() {
    this._linesCache = undefined;

    this._lineIndex = -1;

    this._boundary = "--";
  }
}
