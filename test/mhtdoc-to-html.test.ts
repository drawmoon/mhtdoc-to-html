import { join } from 'path';
import { writeFileSync, readFileSync, mkdtempSync } from 'fs';
import { MhtDocToHtml } from '../src/mhtdoc-to-html';

test('testConvertDocx', () => {
  const docxPath = join(__dirname, 'test-data/mht_document01.docx');
  const buffer = readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);
  const html = converter.convertToHtml();

  expect(html).toEqual('<p>Hello World!</p>');
});

test('testConvertDocxWithImages', () => {
  const docxPath = join(__dirname, 'test-data/mht_document02.docx');
  const buffer = readFileSync(docxPath);

  const base64StrPath = join(
    __dirname,
    'test-data/mht_document02_imgBaseStr.txt',
  );
  const base64Str = readFileSync(base64StrPath, 'utf-8').trim();

  const converter = new MhtDocToHtml(buffer);
  const html = converter.convertToHtml();

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="data:image/jpg;base64,${base64Str}"></figure><p>&nbsp;</p>`,
  );
});

test('testConvertDocxAndSaveImage', () => {
  const docxPath = join(__dirname, 'test-data/mht_document02.docx');
  const buffer = readFileSync(docxPath);

  const tempDir = mkdtempSync('tmp_');
  const filepath = join(tempDir, 'image.jpg');

  const converter = new MhtDocToHtml(buffer);
  const html = converter.convertToHtml((imgBuffer) => {
    writeFileSync(filepath, imgBuffer, 'base64');
    return filepath;
  });

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="${filepath}"></figure><p>&nbsp;</p>`,
  );
});
