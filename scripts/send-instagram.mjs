/**
 * send-instagram.mjs
 * 오늘의 경제 퀴즈 카드 5장을 Instagram Carousel로 게시합니다.
 * (economy-cardnews의 send-instagram.mjs와 동일한 구조)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = join(__dirname, '..', 'data');

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID   = process.env.INSTAGRAM_USER_ID;
const BASE_URL     = process.env.NEXT_PUBLIC_BASE_URL;

const MISSING = [
  !ACCESS_TOKEN && 'INSTAGRAM_ACCESS_TOKEN',
  !IG_USER_ID   && 'INSTAGRAM_USER_ID',
  !BASE_URL     && 'NEXT_PUBLIC_BASE_URL',
].filter(Boolean);

if (MISSING.length) {
  console.error(`❌ 필수 환경변수 누락: ${MISSING.join(', ')}`);
  process.exit(1);
}

const GRAPH_BASE    = 'https://graph.facebook.com/v22.0';
const CARD_COUNT    = 5;
const POLL_INTERVAL = 5_000;
const POLL_TIMEOUT  = 120_000;

async function igPost(path, params) {
  const { default: fetch } = await import('node-fetch');
  const { _token_override, ...rest } = params;
  const token = _token_override || ACCESS_TOKEN;

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token, ...rest }),
    signal: AbortSignal.timeout(30_000),
  });
  const data = await res.json();
  if (data.error) {
    console.error(`  Instagram API 에러: [${path}] code=${data.error.code} — ${data.error.message}`);
    throw new Error(`Instagram API 오류 [${path}] code=${data.error.code}`);
  }
  return data;
}

async function igGet(path, fields, token) {
  const { default: fetch } = await import('node-fetch');
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', token || ACCESS_TOKEN);

  const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  const data = await res.json();
  if (data.error) throw new Error(`Instagram API GET 오류 [${path}]: ${data.error.message}`);
  return data;
}

async function waitForContainer(id, label, token) {
  const deadline = Date.now() + POLL_TIMEOUT;
  while (Date.now() < deadline) {
    const { status_code } = await igGet(`/${id}`, 'status_code', token);
    if (status_code === 'FINISHED')    { console.log(`  ✅ ${label} 준비 완료`); return; }
    if (status_code === 'IN_PROGRESS') { process.stdout.write('.'); await new Promise(r => setTimeout(r, POLL_INTERVAL)); continue; }
    if (status_code === 'ERROR')       throw new Error(`${label} 컨테이너 오류`);
    if (status_code === 'EXPIRED')     throw new Error(`${label} 컨테이너 만료`);
    console.warn(`  ⚠️ 예상치 못한 상태: ${status_code}`); return;
  }
  throw new Error(`${label} 타임아웃`);
}

function buildCaption(today) {
  const date = (today.date || '').replace(/-/g, '.');
  const lines = [
    `💰 오늘의 경제 퀴즈 #${today.number}`,
    ``,
    `Q. ${today.quiz}`,
    `A. ${today.answer}`,
    ``,
    `${today.explanation}`,
    ``,
    `━━━━━━━━━━━━━━`,
    `📚 카테고리: ${today.category}`,
    `📅 ${date} | 어린이 경제 퀴즈`,
    ``,
    `#초등경제교육 #어린이경제 #경제퀴즈 #용돈교육 #금융교육`,
    `#초등맘 #3040학부모 #자녀교육 #경제공부 #어린이금융`,
  ];
  const caption = lines.join('\n');
  return caption.length > 2200 ? caption.slice(0, 2197) + '...' : caption;
}

function saveResult(result) {
  writeFileSync(join(DATA_DIR, 'publish-result.json'), JSON.stringify(result, null, 2), 'utf-8');
}

async function main() {
  console.log('📸 Instagram 경제 퀴즈 게시 시작...\n');

  const today = JSON.parse(readFileSync(join(DATA_DIR, 'today.json'), 'utf-8'));
  console.log(`   퀴즈 #${today.number}: ${today.quiz}`);
  console.log(`   정답: ${today.answer}\n`);

  // ── 이미지 URL 확인 ──────────────────────────────────────
  const { default: fetch } = await import('node-fetch');
  console.log('[0] 이미지 URL 확인 중...');
  for (let i = 1; i <= CARD_COUNT; i++) {
    const url = `${BASE_URL}/api/card-image?card=${i}`;
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    console.log(`  카드 ${i}: HTTP ${res.status}`);
    if (!res.ok) { console.error(`  ❌ 카드 ${i} 접근 실패`); process.exit(1); }
  }
  console.log('  ✅ 전체 이미지 접근 가능\n');

  // ── Instagram 계정 ID 확정 ───────────────────────────────
  let realIgId = null, pageToken = null;

  try {
    const pUrl = new URL(`${GRAPH_BASE}/me/accounts`);
    pUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account');
    pUrl.searchParams.set('access_token', ACCESS_TOKEN);
    const pData = await (await fetch(pUrl.toString())).json();
    for (const page of (pData.data ?? [])) {
      if (page.instagram_business_account?.id) {
        realIgId = page.instagram_business_account.id;
        pageToken = page.access_token;
        console.log(`  페이지: "${page.name}" → Instagram ID: ${realIgId}`);
        break;
      }
    }
  } catch { /* 폴백 */ }

  if (!realIgId) {
    console.warn('  ⚠️ 자동 조회 실패 → INSTAGRAM_USER_ID 직접 사용');
    realIgId = IG_USER_ID;
  }
  const ACTUAL_ID    = realIgId;
  const ACTUAL_TOKEN = pageToken || ACCESS_TOKEN;
  console.log(`  ✅ 계정 ID: ${ACTUAL_ID}\n`);

  // ── 컨테이너 생성 ────────────────────────────────────────
  console.log(`[1] 이미지 컨테이너 생성 중 (${CARD_COUNT}장)...`);
  const containerIds = [];
  for (let i = 1; i <= CARD_COUNT; i++) {
    const imageUrl = `${BASE_URL}/api/card-image?card=${i}`;
    const { id } = await igPost(`/${ACTUAL_ID}/media`, {
      image_url: imageUrl,
      is_carousel_item: true,
      _token_override: ACTUAL_TOKEN,
    });
    containerIds.push(id);
    console.log(`  카드 ${i}: ${id}`);
  }

  // ── 컨테이너 폴링 ────────────────────────────────────────
  console.log('\n[2] 컨테이너 처리 대기 중...');
  for (let i = 0; i < containerIds.length; i++) {
    process.stdout.write(`  카드 ${i + 1} `);
    await waitForContainer(containerIds[i], `카드 ${i + 1}`, ACTUAL_TOKEN);
  }

  // ── Carousel 컨테이너 ────────────────────────────────────
  console.log('\n[3] Carousel 컨테이너 생성 중...');
  const caption = buildCaption(today);
  const { id: carouselId } = await igPost(`/${ACTUAL_ID}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    _token_override: ACTUAL_TOKEN,
  });
  console.log(`  Carousel ID: ${carouselId}`);
  process.stdout.write('  Carousel 처리 중 ');
  await waitForContainer(carouselId, 'Carousel', ACTUAL_TOKEN);

  // ── 게시 ─────────────────────────────────────────────────
  console.log('\n[4] 게시 중...');
  const { id: postId } = await igPost(`/${ACTUAL_ID}/media_publish`, {
    creation_id: carouselId,
    _token_override: ACTUAL_TOKEN,
  });

  console.log(`\n🎉 게시 완료!`);
  console.log(`   Post ID: ${postId}`);

  saveResult({
    date: today.date,
    quizNumber: today.number,
    executedAt: new Date().toISOString(),
    status: 'success',
    postId,
    error: null,
  });
}

main().catch((err) => {
  console.error('\n💥 오류:', err.message);
  let today = { date: '', number: 0 };
  try { today = JSON.parse(readFileSync(join(DATA_DIR, 'today.json'), 'utf-8')); } catch {}
  saveResult({ date: today.date, quizNumber: today.number, executedAt: new Date().toISOString(), status: 'failure', postId: null, error: err.message });
  process.exit(1);
});
