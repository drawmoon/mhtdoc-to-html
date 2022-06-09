import AdmZip from 'adm-zip';
import { DocumentPart } from './interfaces';
import { JSDOM } from 'jsdom';
import assert from 'assert';

export class MhtDocToHtml {
  /**
   * afchunk.mht 文件的 Buffer
   */
  private readonly _buffer: Buffer;

  /**
   * afchunk.mht 内容缓存
   */
  private _linesCache?: string[] | undefined = undefined;

  /**
   * 当前读取的行数
   */
  private _lineIndex = -1;

  /**
   * 分隔符
   */
  private _boundary = '--';

  constructor(buf: Buffer) {
    if (!buf) {
      throw new Error('Buffer is undefined.');
    }

    // 提取 afchunk.mht 文件的 Buffer
    this._buffer = this.extract(buf);
  }

  /**
   * 将文档转换为 HTML 格式的字符形式
   * @param imageConvert
   * @example
   * ```
   * import { writeFileSync, readFileSync } from 'fs';
   *
   * const buf = readFileSync('/app/document.docx');
   *
   * const imageConvert = (buf: Buffer) => {
   *    const imgPath = '/app/images/img1.png';
   *    writeFileSync(imgPath, buf, 'base64');
   *    return imgPath;
   * };
   * const converter = new MhtDocToHtml(buf);
   * const html = converter.convertToHtml(imageConvert);
   * ```
   * @returns {String} HTML 格式的字符形式
   */
  public convertToHtml(imageConvert?: (base64Buf: Buffer) => string): string {
    const doc = this.convertToDocument(imageConvert);

    if (!doc) {
      return '';
    }

    return doc.body.innerHTML;
  }

  /**
   * 将文档转换为 Document
   * @param imageConvert
   * @example
   * ```
   * import { writeFileSync, readFileSync } from 'fs';
   *
   * const buf = readFileSync('/app/document.docx');
   *
   * const imageConvert = (buf: Buffer) => {
   *    const imgPath = '/app/images/img1.png';
   *    writeFileSync(imgPath, buf, 'base64');
   *    return imgPath;
   * };
   * const converter = new MhtDocToHtml(buf);
   * const doc = converter.convertToDocument(imageConvert);
   * ```
   * @returns {Document}
   */
  public convertToDocument(
    imageConvert?: (base64Buf: Buffer) => string,
  ): Document | undefined {
    this.reset();

    const documentParts = this.parse();

    if (documentParts.length <= 0) {
      return undefined;
    }

    const htmlPart = documentParts.find((p) =>
      p.contentType.startsWith('text/html'),
    );
    assert(htmlPart);

    const regex = /<[^>]*=(?<stain>3D)+"\S+"\s*\/?>/g;
    const html = htmlPart.data.replace(regex, (sub, stain) => {
      return sub.replace(new RegExp(`${stain}+`, 'g'), '');
    });

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    doc.querySelectorAll('img').forEach((img) => {
      const imgPart = documentParts.find((p) => p.contentLocation === img.src);
      assert(imgPart);

      if (imageConvert) {
        const imageBuf = Buffer.from(imgPart.data, 'base64');
        img.src = imageConvert(imageBuf);
      } else {
        img.src = `data:image/jpg;base64,${imgPart.data}`;
      }
    });

    return doc;
  }

  private extract(buf: Buffer): Buffer {
    let zip: AdmZip;

    try {
      zip = new AdmZip(buf);
    } catch (e) {
      throw new Error('Unable to decompress.');
    }

    const entries = zip.getEntries();

    for (const entry of entries) {
      if (entry.entryName === 'word/afchunk.mht') {
        return entry.getData();
      }
    }

    throw new Error("'afchunk.mht' not found.");
  }

  private parse(): DocumentPart[] {
    const documentParts: DocumentPart[] = [];

    let contentType = '';
    let contentTransferEncoding = '';
    let contentLocation = '';
    let data: string[] = [];

    const safeAdd = (): void => {
      documentParts.push({
        contentType: contentType,
        contentTransferEncoding: contentTransferEncoding,
        contentLocation: contentLocation,
        data: data.join(''),
      });
      contentType = '';
      contentTransferEncoding = '';
      contentLocation = '';
      data = [];
    };

    const parseLine = (line: string): void => {
      let keyValue = this.getValueByKey('MIME-Version', line);
      if (keyValue) {
        if (keyValue !== '1.0') {
          throw new Error('Unsupported version.');
        }
        return;
      }

      keyValue = this.getValueByKey('    type', line);
      if (keyValue) {
        return;
      }

      keyValue = this.getValueByKey('    boundary', line);
      if (keyValue) {
        this._boundary = `--${keyValue.trim()}`;
        return;
      }

      // 已经读取到分隔符，并且当前行不是空字符
      if (this._boundary !== '--') {
        keyValue = this.getValueByKey('Content-Type', line);
        if (keyValue) {
          contentType = keyValue;
          return;
        }

        keyValue = this.getValueByKey('    charset', line);
        if (keyValue) {
          contentType += ` charset="${keyValue}"`;
          return;
        }

        keyValue = this.getValueByKey('Content-Transfer-Encoding', line);
        if (keyValue) {
          contentTransferEncoding = keyValue;
          return;
        }

        keyValue = this.getValueByKey('Content-Location', line);
        if (keyValue) {
          contentLocation = keyValue;
          return;
        }

        // 读取到内容
        data.push(line.trim());
      }
    };

    while (this.read()) {
      const line = this.current;

      if (!line) {
        continue;
      }

      // 判断是否读取到开始分隔符
      if (line === this._boundary) {
        safeAdd();
        continue;
      }

      // 判断是否读取到结束分隔符
      if (line === `${this._boundary}--`) {
        safeAdd();
        this._boundary = '--';
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
    let index = line.indexOf(':');

    if (index > -1) {
      return innerGetValue();
    }

    // 解析 'boundary="----=mhtDocumentPart"' 格式的行
    index = line.indexOf('=');

    if (index > -1) {
      const value = innerGetValue();

      return value?.replace(/^"+|\"+$/g, '') ?? null;
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

  private extractLines(
    buffer: Buffer,
    options?: BufferEncoding | undefined,
  ): string[] {
    return buffer.toString(options ?? 'utf-8').split(/(?:\r\n|\r|\n)/g);
  }

  private get current(): string {
    if (!this._linesCache || this._lineIndex >= this._linesCache.length) {
      throw new Error('Trying to read beyond end of stream.');
    }

    return this._linesCache[this._lineIndex];
  }

  private reset(): void {
    this._linesCache = undefined;
    this._lineIndex = -1;
    this._boundary = '--';
  }
}
