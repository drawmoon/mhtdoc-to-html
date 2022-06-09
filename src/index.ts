import { MhtDocToHtml } from './mhtdoc-to-html';

/**
 * 将文档转换为 HTML 格式的字符形式
 * @param {Buffer} buf
 * @param imageConvert
 * @example
 * import { writeFileSync, readFileSync } from 'fs';
 *
 * const buf = readFileSync('/app/document.docx');
 *
 * const imageConvert = (buf: Buffer) => {
 *    const imgPath = '/app/images/img1.png';
 *    writeFileSync(imgPath, buf, 'base64');
 *    return imgPath;
 * };
 * const html = convert(buf, imageConvert);
 * @returns {String} HTML 格式的字符形式
 */
export function convert(
  buf: Buffer,
  imageConvert?: (base64Buf: Buffer) => string,
): string {
  const converter = new MhtDocToHtml(buf);
  return converter.convertToHtml(imageConvert);
}

export * from './mhtdoc-to-html';
export * from './interfaces';
