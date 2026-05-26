/**
 * pick-planb.mjs
 * planb-bank.json에서 다음 B안 콘텐츠를 순서대로 선택해
 * today-planb.json에 저장합니다.
 * planb-index.json으로 마지막 인덱스를 추적하며, 100개를 다 쓰면 처음부터 반복합니다.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');

const bank      = JSON.parse(readFileSync(join(DATA_DIR, 'planb-bank.json'),  'utf-8'));
const indexData = JSON.parse(readFileSync(join(DATA_DIR, 'planb-index.json'), 'utf-8'));

const nextIndex = (indexData.lastIndex ?? 0) % bank.length;
const item      = bank[nextIndex];

// KST 기준 오늘 날짜
const kst  = new Date(Date.now() + 9 * 60 * 60 * 1000);
const date = kst.toISOString().slice(0, 10);

const today = {
  date,
  number:  item.number,
  title:   item.title,
  sl1:     item.sl1,
  sl2:     item.sl2,
  sl3:     item.sl3,
  sl4:     item.sl4,
  sl5:     item.sl5,
  caption: item.caption,
};

writeFileSync(join(DATA_DIR, 'today-planb.json'),  JSON.stringify(today,                        null, 2), 'utf-8');
writeFileSync(join(DATA_DIR, 'planb-index.json'),  JSON.stringify({ lastIndex: nextIndex + 1 }, null, 2), 'utf-8');

console.log(`✅ 오늘의 B안 콘텐츠 선택 완료`);
console.log(`   날짜  : ${date}`);
console.log(`   번호  : #${item.number}`);
console.log(`   제목  : ${item.title}`);
