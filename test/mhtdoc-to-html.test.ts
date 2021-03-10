import path from "path";
import fs from "fs";
import { MhtDocToHtml } from "../src/mhtdoc-to-html";
import { base64Str } from "./base64-str";

test("mhtdocx", () => {
  const docxPath = path.join(__dirname, "test-data/mht_document01.docx");

  const buffer = fs.readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);

  const html = converter.convertToHtml();

  expect(html).toEqual("<p>Hello World!</p>");
});

test("mhtdocx with image", () => {
  const docxPath = path.join(__dirname, "test-data/mht_document02.docx");

  const buffer = fs.readFileSync(docxPath);

  const converter = new MhtDocToHtml(buffer);

  const html = converter.convertToHtml();

  expect(html).toEqual(
    `<p>Hello World!</p><figure class="image"><img src="data:image/jpg;base64,${base64Str}"></figure><p>&nbsp;</p>`
  );
});
