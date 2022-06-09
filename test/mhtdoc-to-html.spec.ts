import { join } from 'path';
import { writeFileSync, readFileSync, mkdtempSync } from 'fs';
import { convert, MhtDocToHtml } from '../src';

const basedir = join(__dirname, 'test-data');

function readBuffer(filename: string): Buffer {
  const file = join(basedir, filename);
  return readFileSync(file);
}

test('convert docx to html', () => {
  const buffer = readBuffer('mht_document01.docx');

  const html = convert(buffer);

  expect(html).toEqual('<p>Hello World!</p>');
});

test('convert docx with images to html', () => {
  const buffer = readBuffer('mht_document02.docx');

  const htmlfile = join(basedir, 'mht_document02.docx.html');
  const expected = readFileSync(htmlfile, 'utf-8').trim();

  const html = convert(buffer);

  expect(html).toEqual(expected);
});

test('convert docx with images to html, and save image', () => {
  const buffer = readBuffer('mht_document02.docx');

  const tempDir = mkdtempSync('tmp_');
  const imgpath = join(tempDir, 'image.png');

  const imageConvert = (imgBuf: Buffer) => {
    writeFileSync(imgpath, imgBuf, 'base64');
    return imgpath;
  };
  const html = convert(buffer, imageConvert);

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="${imgpath}"></figure><p>&nbsp;</p>`,
  );
});

test('convert docx to html by instance', () => {
  const buffer = readBuffer('mht_document01.docx');

  const converter = new MhtDocToHtml(buffer);
  const html = converter.convertToHtml();

  expect(html).toEqual('<p>Hello World!</p>');
});
