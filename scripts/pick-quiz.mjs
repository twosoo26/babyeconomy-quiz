/**
 * pick-quiz.mjs
 * quizzes.json에서 다음 퀴즈를 순서대로 선택해 today.json에 저장합니다.
 * quiz-index.json으로 마지막 인덱스를 추적하며, 100개를 다 쓰면 처음부터 반복합니다.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const quizzes   = JSON.parse(readFileSync(join(DATA_DIR, 'quizzes.json'),    'utf-8'));
const indexData = JSON.parse(readFileSync(join(DATA_DIR, 'quiz-index.json'), 'utf-8'));

const nextIndex = (indexData.lastIndex ?? 0) % quizzes.length;
const quiz      = quizzes[nextIndex];

// KST 기준 오늘 날짜
const kst  = new Date(Date.now() + 9 * 60 * 60 * 1000);
const date = kst.toISOString().slice(0, 10);

const today = {
  date,
  number:      quiz.number,
  category:    quiz.category,
  quiz:        quiz.quiz,
  answer:      quiz.answer,
  explanation: quiz.explanation,
};

writeFileSync(join(DATA_DIR, 'today.json'),      JSON.stringify(today,      null, 2), 'utf-8');
writeFileSync(join(DATA_DIR, 'quiz-index.json'), JSON.stringify({ lastIndex: nextIndex + 1 }, null, 2), 'utf-8');

console.log(`✅ 오늘의 퀴즈 선택 완료`);
console.log(`   날짜   : ${date}`);
console.log(`   번호   : #${quiz.number} / 100`);
console.log(`   카테고리: ${quiz.category}`);
console.log(`   문제   : ${quiz.quiz}`);
console.log(`   정답   : ${quiz.answer}`);
