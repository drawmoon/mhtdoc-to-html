import { join } from 'path';
import { readFileSync } from 'fs';

const regex = /<[^>]*=(?<stain>3D)+"\S+"\s*\/?>/g;

test('test01', () => {
  const htmlStr = readFileSync(
    join(__dirname, 'test-data/html01.html'),
    'utf-8',
  );

  const rst = readFileSync(
    join(__dirname, 'test-data/html01_rst.html'),
    'utf-8',
  );

  const s = htmlStr.replace(regex, (sub, stain) => {
    return sub.replace(new RegExp(`${stain}+`, 'g'), '');
  });
  expect(s).toEqual(rst);
});
