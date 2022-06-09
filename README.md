# mhtdoc-to-html

[![NPM Version][npm-image]][npm-url]

Convert Altchunks Word documents (.docx file) to HTML format.

## Installing

Install `mhtdoc-to-html` using `npm`:

```bash
npm install --save mhtdoc-to-html
```

Or `yarn`:

```bash
yarn add mhtdoc-to-html
```

## Using

```typescript
import fs from 'fs';
import { MhtDocToHtml } from 'mhtdoc-to-html';

const buffer = fs.readFileSync('/document.docx');
const converter = new MhtDocToHtml(buffer);
const html = converter.convertToHtml();

console.log(html);
```

## License

[MIT](LICENSE)

[npm-image]: https://img.shields.io/npm/v/mhtdoc-to-html.svg
[npm-url]: https://npmjs.org/package/mhtdoc-to-html