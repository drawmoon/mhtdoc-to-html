# mhtdoc-to-html

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

[MIT](/license)
