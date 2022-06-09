import { join } from 'path';
import { readFileSync } from 'fs';

const basedir = join(__dirname, 'test-data');

const regex = /<[^>]*=(?<stain>3D)+"\S+"\s*\/?>/g;

test('test01', () => {
  const html = readFileSync(join(basedir, 'html01.html'), 'utf-8');
  const result = readFileSync(join(basedir, 'html01_result.html'), 'utf-8');

  const str = html.replace(regex, (sub, stain) => {
    return sub.replace(new RegExp(`${stain}+`, 'g'), '');
  });
  expect(str).toEqual(result);
});
