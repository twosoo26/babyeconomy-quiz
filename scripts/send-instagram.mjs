/**
 * send-instagram.mjs
 * 오늘의 경제 퀴즈 카드 5장을 Instagram Carousel로 게시합니다.
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
const FB_PAGE_ID    = '61572139667323';
const CARD_COUNT    = parseInt(process.env.CARD_COUNT ?? '5', 10);
// TODAY_FILE: 읽을 데이터 파일 (기본 today.json, B안은 today-planb.json)
const TODAY_FILE    = process.env.TODAY_FILE ?? 'today.json';
// IMAGE_API: 이미지 생성 API 경로 (기본 /api/card-image, B안은 /api/planb-image)
const IMAGE_API     = process.env.IMAGE_API  ?? '/api/card-image';
const RESULT_FILE   = process.env.RESULT_FILE ?? 'publish-result.json';
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
    console.error('  ── Instagram API 에러 상세 ──');
    console.error(`  code       : ${data.error.code}`);
    console.error(`  subcode    : ${data.error.error_subcode ?? '없음'}`);
    console.error(`  message    : ${data.error.message}`);
    console.error(`  user_msg   : ${data.error.error_user_msg ?? '없음'}`);
    console.error(`  fbtrace_id : ${data.error.fbtrace_id ?? '없음'}`);
    console.error(`  type       : ${data.error.type ?? '없음'}`);
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
    switch (status_code) {
      case 'FINISHED':
        console.log(`  ✅ ${label} 준비 완료 (${id})`);
        return;
      case 'IN_PROGRESS':
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
        break;
      case 'ERROR':
        throw new Error(`${label} 컨테이너 처리 오류 (ERROR 상태)`);
      case 'EXPIRED':
        throw new Error(`${label} 컨테이너 만료 (EXPIRED 상태) — 1시간 내 게시해야 합니다.`);
      default:
        console.warn(`  ⚠️ ${label} 예상치 못한 상태: ${status_code}`);
        return;
    }
  }
  throw new Error(`${label} 타임아웃 (${POLL_TIMEOUT / 1000}초 초과)`);
}

function buildCaption(today) {
  // B안: caption 필드 + 참여 유도 CTA 자동 추가
  if (today.caption) {
    const cta = '\n\n━━━━━━━━━━━━━━\n혹시 이 말 해본 적 있으신가요?\n경험 있으시면 댓글로 알려주세요! 👇';
    const full = today.caption + cta;
    return full.length > 2200 ? full.slice(0, 2197) + '...' : full;
  }
  // 퀴즈: 자동 생성
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
  writeFileSync(join(DATA_DIR, RESULT_FILE), JSON.stringify(result, null, 2), 'utf-8');
}

async function main() {
  console.log('📸 Instagram 경제 퀴즈 게시 시작...\n');

  const today = JSON.parse(readFileSync(join(DATA_DIR, TODAY_FILE), 'utf-8'));
  console.log(`   파일: ${TODAY_FILE} | API: ${IMAGE_API}`);
  console.log(`   #${today.number}: ${today.quiz ?? today.title ?? ''}`);

  const { default: fetch } = await import('node-fetch');

  // ── 토큰 권한 진단 ──────────────────────────────────────
  console.log('[진단] 토큰 권한 확인 중...');
  try {
    const permUrl = new URL(`${GRAPH_BASE}/me/permissions`);
    permUrl.searchParams.set('access_token', ACCESS_TOKEN);
    const permRes = await fetch(permUrl.toString());
    const permData = await permRes.json();
    if (permData.data) {
      const granted  = permData.data.filter(p => p.status === 'granted').map(p => p.permission);
      const required = ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_show_list'];
      console.log(`  보유 권한: ${granted.join(', ')}`);
      const missing = required.filter(r => !granted.includes(r));
      if (missing.length) {
        console.error(`  ❌ 누락 권한: ${missing.join(', ')}`);
        console.error('  → Graph API Explorer에서 해당 권한 체크 후 토큰 재발급 필요');
        process.exit(1);
      }
      console.log('  ✅ 필수 권한 모두 보유');
    }
  } catch (e) {
    console.warn(`  ⚠️ 권한 확인 실패 (계속 진행): ${e.message}`);
  }

  // ── Instagram 계정 ID 확정 (4가지 방법) ─────────────────
  console.log('\n[계정] Instagram Business Account ID 조회 중...');
  let realIgId = null;
  let pageAccessToken = null;

  // 방법 1: /me/accounts
  try {
    const pagesUrl = new URL(`${GRAPH_BASE}/me/accounts`);
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account');
    pagesUrl.searchParams.set('access_token', ACCESS_TOKEN);
    const pagesData = await (await fetch(pagesUrl.toString())).json();
    if (pagesData.data?.length) {
      for (const page of pagesData.data) {
        if (page.instagram_business_account?.id) {
          realIgId = page.instagram_business_account.id;
          pageAccessToken = page.access_token;
          console.log(`  [방법1] 페이지 "${page.name}" → Instagram ID: ${realIgId}`);
          break;
        }
      }
    }
    if (!realIgId) console.warn('  ⚠️ [방법1] /me/accounts 결과 없음 (New Page Experience 환경)');
  } catch (e) {
    console.warn(`  ⚠️ [방법1] /me/accounts 실패: ${e.message}`);
  }

  // 방법 2: Facebook Page ID 직접 조회 (New Page Experience 대응)
  if (!realIgId) {
    try {
      const pageUrl = new URL(`${GRAPH_BASE}/${FB_PAGE_ID}`);
      pageUrl.searchParams.set('fields', 'id,name,instagram_business_account,access_token');
      pageUrl.searchParams.set('access_token', ACCESS_TOKEN);
      const pageData = await (await fetch(pageUrl.toString())).json();
      if (pageData.instagram_business_account?.id) {
        realIgId = pageData.instagram_business_account.id;
        pageAccessToken = pageData.access_token || null;
        console.log(`  [방법2] 페이지 직접 조회 "${pageData.name}" → Instagram ID: ${realIgId}`);
      } else {
        console.warn(`  ⚠️ [방법2] 페이지 직접 조회에서 instagram_business_account 없음`);
        if (pageData.error) console.warn(`     에러: ${pageData.error.message}`);
      }
    } catch (e) {
      console.warn(`  ⚠️ [방법2] Facebook 페이지 직접 조회 실패: ${e.message}`);
    }
  }

  // 방법 3: /me/instagram_accounts
  if (!realIgId) {
    try {
      const igUrl = new URL(`${GRAPH_BASE}/me/instagram_accounts`);
      igUrl.searchParams.set('fields', 'id,username');
      igUrl.searchParams.set('access_token', ACCESS_TOKEN);
      const igData = await (await fetch(igUrl.toString())).json();
      if (igData.data?.length) {
        realIgId = igData.data[0].id;
        console.log(`  [방법3] Instagram 직접 조회: @${igData.data[0].username} → ${realIgId}`);
      } else {
        console.warn('  ⚠️ [방법3] /me/instagram_accounts 비어있음');
      }
    } catch (e) {
      console.warn(`  ⚠️ [방법3] /me/instagram_accounts 실패: ${e.message}`);
    }
  }

  // 방법 4: INSTAGRAM_USER_ID Secret 폴백
  if (!realIgId) {
    console.warn(`  ⚠️ [방법4] INSTAGRAM_USER_ID Secret(${IG_USER_ID}) 직접 사용`);
    realIgId = IG_USER_ID;
  }

  // 방법 5: 하드코딩 폴백 (soo_tationary 계정 ID)
  const HARDCODED_IG_ID = '17841475989162828';
  if (!realIgId || realIgId === IG_USER_ID) {
    console.warn(`  ⚠️ [방법5] 하드코딩 ID(${HARDCODED_IG_ID}) 병행 시도`);
  }

  const ACTUAL_ID    = realIgId;
  const ACTUAL_TOKEN = pageAccessToken || ACCESS_TOKEN;
  console.log(`  ✅ 계정 ID 확정: ${ACTUAL_ID}`);
  console.log(`  ✅ 사용 토큰: ${pageAccessToken ? 'Page Access Token' : 'User Access Token'}`);

  // ── 확정된 ID 유효성 검증 (비치명적) ────────────────────
  console.log('\n[검증] Instagram ID 유효성 검증 중...');
  let verifiedId = ACTUAL_ID;
  try {
    const verifyUrl = new URL(`${GRAPH_BASE}/${ACTUAL_ID}`);
    verifyUrl.searchParams.set('fields', 'id,name,username');
    verifyUrl.searchParams.set('access_token', ACTUAL_TOKEN);
    const verifyData = await (await fetch(verifyUrl.toString())).json();
    if (verifyData.error) {
      console.warn(`  ⚠️ ID(${ACTUAL_ID}) 검증 실패: ${verifyData.error.message}`);
      console.warn(`  → 하드코딩 ID(${HARDCODED_IG_ID})로 전환`);
      verifiedId = HARDCODED_IG_ID;
    } else if (!verifyData.username) {
      console.warn(`  ⚠️ ID(${ACTUAL_ID}) = "${verifyData.name}" → Instagram 계정이 아님 (Facebook 페이지/유저)`);
      console.warn(`  → 하드코딩 ID(${HARDCODED_IG_ID})로 전환`);
      verifiedId = HARDCODED_IG_ID;
    } else {
      console.log(`  id      : ${verifyData.id}`);
      console.log(`  username: @${verifyData.username}`);
      console.log(`  name    : ${verifyData.name ?? '(없음)'}`);
      console.log('  ✅ Instagram 계정 확인 완료');
    }
  } catch (e) {
    console.warn(`  ⚠️ ID 검증 오류: ${e.message} → 하드코딩 ID로 전환`);
    verifiedId = HARDCODED_IG_ID;
  }
  console.log(`  ✅ 최종 사용 ID: ${verifiedId}`);
  const FINAL_ID = verifiedId;

  // ── 이미지 URL 접근 확인 ──────────────────────────────────
  console.log('\n[0] 이미지 URL 확인 중...');
  for (let i = 1; i <= CARD_COUNT; i++) {
    const url = `${BASE_URL}${IMAGE_API}?card=${i}`;
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10_000) });
    console.log(`  카드 ${i}: HTTP ${res.status}`);
    if (!res.ok) {
      console.error(`  ❌ 카드 ${i} 접근 실패: ${url}`);
      process.exit(1);
    }
  }
  console.log('  ✅ 전체 이미지 접근 가능\n');

  // ── 이미지 컨테이너 생성 ──────────────────────────────────
  console.log(`[1] 이미지 컨테이너 생성 중 (${CARD_COUNT}장)...`);
  const containerIds = [];
  for (let i = 1; i <= CARD_COUNT; i++) {
    const imageUrl = `${BASE_URL}${IMAGE_API}?card=${i}`;
    const { id } = await igPost(`/${FINAL_ID}/media`, {
      image_url: imageUrl,
      is_carousel_item: true,
      _token_override: ACTUAL_TOKEN,
    });
    containerIds.push(id);
    console.log(`  카드 ${i}: ${id}`);
  }

  // ── 컨테이너 폴링 ─────────────────────────────────────────
  // 상태 조회(GET)는 User Access Token이 필요 (Page Token 불가)
  console.log('\n[2] 컨테이너 처리 대기 중...');
  for (let i = 0; i < containerIds.length; i++) {
    process.stdout.write(`  카드 ${i + 1} 처리 중 `);
    await waitForContainer(containerIds[i], `카드 ${i + 1}`, ACCESS_TOKEN);
  }

  // ── Carousel 컨테이너 생성 ────────────────────────────────
  console.log('\n[3] Carousel 컨테이너 생성 중...');
  const caption = buildCaption(today);
  const { id: carouselId } = await igPost(`/${FINAL_ID}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    _token_override: ACTUAL_TOKEN,
  });
  console.log(`  Carousel ID: ${carouselId}`);
  process.stdout.write('  Carousel 처리 중 ');
  await waitForContainer(carouselId, 'Carousel', ACCESS_TOKEN);

  // ── 게시 ──────────────────────────────────────────────────
  console.log('\n[4] 게시 중...');
  const { id: postId } = await igPost(`/${FINAL_ID}/media_publish`, {
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
  try { today = JSON.parse(readFileSync(join(DATA_DIR, TODAY_FILE), 'utf-8')); } catch {}
  saveResult({
    date: today.date,
    quizNumber: today.number,
    executedAt: new Date().toISOString(),
    status: 'failure',
    postId: null,
    error: err.message,
  });
  process.exit(1);
});
