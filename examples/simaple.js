const { MhtDocToHtml } = require('../dist/index');
const path = require('path');
const fs = require('fs');

const file = path.join(__dirname.replace('examples', ''), 'test/test-data/mht_document01.docx');
const buf = fs.readFileSync(file);

const converter = new MhtDocToHtml(buf);
const doc = converter.convertToDocument();

console.log(doc.body.innerHTML);
