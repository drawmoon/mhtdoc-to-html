import { join } from 'path';
import { writeFileSync, readFileSync, mkdtempSync } from 'fs';
import { MhtDocToHtml } from '../src/mhtdoc-to-html';
import { base64Str } from './base64-str';

test('docx', async () => {
  const docxPath = join(__dirname, 'test-data/mht_document01.docx');

  const buffer = readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);

  const html = await converter.convertToHtml();

  expect(html).toEqual('<p>Hello World!</p>');
});

test('docx with image', async () => {
  const docxPath = join(__dirname, 'test-data/mht_document02.docx');

  const buffer = readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);

  const html = await converter.convertToHtml();

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="data:image/jpg;base64,${base64Str}"></figure><p>&nbsp;</p>`,
  );
});

test('convert image', async () => {
  const tempdir = mkdtempSync('tmp_');
  const filepath = join(tempdir, 'image.jpg');

  const docxPath = join(__dirname, 'test-data/mht_document02.docx');

  const buffer = readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);

  const html = await converter.convertToHtml((imgBuffer) => {
    writeFileSync(filepath, imgBuffer, 'base64');
    return filepath;
  });

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="${filepath}"></figure><p>&nbsp;</p>`,
  );
});
