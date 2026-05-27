import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1350;

// HTML 340×420 → Instagram 1080×1350 (×3.18)
const C = {
  pk:      '#D94040',
  pkLight: '#FFF4F4',
  pkDeep:  '#B53030',
  pkPale:  '#F8DADA',
  cream:   '#FDF8F5',
  dark:    '#1A1A1A',
  gray:    '#BBA090',
  white:   '#FFFFFF',
};

function loadFont(filename: string): ArrayBuffer {
  const buf = readFileSync(path.join(process.cwd(), 'public', 'fonts', filename));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function loadToday() {
  const raw = readFileSync(path.join(process.cwd(), 'data', 'today-planb.json'), 'utf-8');
  return JSON.parse(raw) as {
    date: string; number: number; title: string;
    sl1: string; sl2: string; sl3: string; sl4: string; sl5: string; caption: string;
  };
}

/** "\"금지어\" - 설명" → { quote, body } */
function splitSlide(text: string) {
  const idx = text.indexOf('" - ');
  if (idx !== -1) {
    return {
      quote: text.slice(0, idx + 1).replace(/^"|"$/g, ''),
      body:  text.slice(idx + 4),
    };
  }
  return { quote: text, body: '' };
}

/** sl1에서 sub / main 분리: "용돈 줄 때, 이 말은..." → sub:"용돈 줄 때," main:"이 말은..." */
function splitSl1(sl1: string) {
  const commaIdx = sl1.indexOf(', ');
  if (commaIdx !== -1) {
    return {
      sub:  sl1.slice(0, commaIdx + 1),                        // "용돈 줄 때,"
      main: sl1.slice(commaIdx + 2).replace(/[?🚫✅❗⚠️🔻]/gu, '').trim(), // "이 말은 절대 금지"
    };
  }
  return { sub: '', main: sl1 };
}

function Shell({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: W, height: H, background: bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// 카드 1: 커버  (HTML .s1 기반)
// ══════════════════════════════════════════════════════
function CoverCard({ today }: { today: ReturnType<typeof loadToday> }) {
  const num = String(today.number).padStart(3, '0');
  const { sub, main } = splitSl1(today.sl1);

  // 메인 문구 길이에 따라 폰트 크기 조절
  const mainLen = main.length;
  const mainSize = mainLen <= 8 ? 133 : mainLen <= 12 ? 110 : mainLen <= 18 ? 90 : 76;

  return (
    <Shell bg={C.cream}>
      {/* ⭐ top:56 right:18 fs:18 → top:178 right:57 fs:57 */}
      <div style={{
        position: 'absolute', top: 178, right: 57,
        fontSize: 57, lineHeight: 1, opacity: 0.6, display: 'flex',
        transform: 'rotate(-8deg)',
      }}>⭐</div>
      {/* 🍒 right:26 bottom:76 fs:22 → right:83 bottom:241 fs:70 */}
      <div style={{
        position: 'absolute', right: 83, bottom: 241,
        fontSize: 70, lineHeight: 1, opacity: 0.65, display: 'flex',
        transform: 'rotate(6deg)',
      }}>🍒</div>

      {/* 상단 body: padding 30 28 0 → 95 89 0 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '95px 89px 0' }}>

        {/* 시리즈 레이블: fs:10 w:600 #BBA090 ls:.16em mb:22 → fs:32 mb:70 */}
        <span style={{
          fontSize: 32, fontWeight: 600, color: C.gray,
          letterSpacing: '0.16em', marginBottom: 70, fontFamily: 'body',
        }}>
          {num} — 엄마표 경제교육
        </span>

        {/* 소제목: fs:14 w:500 #BBA090 mb:8 → fs:44 mb:25 */}
        <span style={{
          fontSize: 44, fontWeight: 500, color: C.gray,
          marginBottom: 25, fontFamily: 'body',
        }}>
          {sub}
        </span>

        {/* 메인 타이틀: fs:42 w:800 #1A1A1A lh:1.1 ls:-1.5px → fs:동적 */}
        <span style={{
          fontSize: mainSize, fontWeight: 700, color: C.dark,
          lineHeight: 1.1, letterSpacing: '-1.5px', fontFamily: 'display',
          wordBreak: 'keep-all',
        }}>
          {main}
        </span>

        {/* 포인트 라인: mt:16 gap:10 → mt:51 gap:32 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 51 }}>
          {/* 가로선: w:36 h:3 → w:114 h:10 */}
          <div style={{ width: 114, height: 10, background: C.pk, borderRadius: 6, display: 'flex' }} />
          {/* "3가지 🚫": fs:13 w:700 → fs:41 */}
          <span style={{ fontSize: 41, fontWeight: 700, color: C.pk, fontFamily: 'body' }}>
            3가지 🚫
          </span>
        </div>

      </div>

      {/* 하단 체리 블록: padding 15 28 → 48 89 */}
      <div style={{
        background: C.pk, padding: '48px 89px', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* fs:13 w:700 #fff → fs:41 */}
        <span style={{ fontSize: 41, fontWeight: 700, color: C.white, fontFamily: 'body' }}>
          혹시 오늘 이 말 했나요? 👀
        </span>
        {/* fs:18 → fs:57 */}
        <span style={{ fontSize: 57, display: 'flex' }}>👇</span>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════
// 카드 2·3·4: 본문  (HTML .sc 기반)
// ══════════════════════════════════════════════════════
function ContentCard({
  num, label, sticker, rotateDeg, slideText, pageLabel,
}: {
  num: string; label: string; sticker: string; rotateDeg: string;
  slideText: string; pageLabel: string;
}) {
  const { quote, body } = splitSlide(slideText);

  // 금지어 길이에 따라 폰트 크기: HTML 19px(긴것) / 22px(짧은것) → ×3.18
  const quoteSize = quote.length > 10 ? 60 : 70;

  return (
    <Shell bg={C.white}>
      {/* 감정 스티커: top:16 right:20 fs:22 → top:51 right:64 fs:70 */}
      <div style={{
        position: 'absolute', top: 51, right: 64,
        fontSize: 70, opacity: 0.7, display: 'flex',
        transform: `rotate(${rotateDeg})`,
      }}>
        {sticker}
      </div>

      {/* 전체: padding 30 26 → 95 83 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '95px 83px 0' }}>

        {/* 헤더: gap:12 mb:20 → gap:38 mb:64 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 38, marginBottom: 64 }}>

          {/* 대형 번호: fs:50 w:800 #F8DADA lh:1 → fs:159 */}
          <span style={{
            fontSize: 159, fontWeight: 700, color: C.pkPale,
            lineHeight: 1, flexShrink: 0, fontFamily: 'display',
          }}>
            {num}
          </span>

          {/* 우측: padding-top:2 → 6 */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 6 }}>
            {/* 레이블: fs:10 w:600 #D94040 ls:.12em mb:6 → fs:32 mb:19 */}
            <span style={{
              fontSize: 32, fontWeight: 600, color: C.pk,
              letterSpacing: '0.12em', marginBottom: 19, fontFamily: 'body',
            }}>
              {label}
            </span>
            {/* 금지어 제목: w:800 #1A1A1A ls:-.3px white-space:nowrap */}
            <span style={{
              fontSize: quoteSize, fontWeight: 700, color: C.dark,
              letterSpacing: '-0.3px', fontFamily: 'display',
            }}>
              "{quote}"
            </span>
          </div>
        </div>

        {/* 구분선: h:1 #F5E8E8 mb:18 → h:3 mb:57 */}
        <div style={{ height: 3, background: '#F5E8E8', marginBottom: 57, display: 'flex' }} />

        {/* 설명 박스: bg:#FFF4F4 br:12 padding:16 18 → br:38 padding:51 57 */}
        <div style={{
          background: C.pkLight, borderRadius: 38,
          padding: '51px 57px', display: 'flex', flexDirection: 'column',
        }}>
          {/* 소제목: fs:11 w:700 #B53030 mb:8 → fs:35 mb:25 */}
          <span style={{
            fontSize: 35, fontWeight: 700, color: C.pkDeep,
            marginBottom: 25, fontFamily: 'body',
          }}>
            왜 안 될까요?
          </span>
          {/* 본문: fs:14 w:400 #3A3A3A lh:1.85 → fs:44 */}
          <span style={{
            fontSize: 44, fontWeight: 400, color: '#3A3A3A',
            lineHeight: 1.85, fontFamily: 'body', wordBreak: 'keep-all',
          }}>
            {body || slideText}
          </span>
        </div>

      </div>

      {/* 페이지: bottom:18 right:24 fs:10 w:600 #ECC8C8 → bottom:57 right:76 fs:32 */}
      <div style={{ position: 'absolute', bottom: 57, right: 76, display: 'flex' }}>
        <span style={{
          fontSize: 32, fontWeight: 600, color: '#ECC8C8',
          letterSpacing: '0.1em', fontFamily: 'body',
        }}>
          {pageLabel}
        </span>
      </div>
    </Shell>
  );
}

// ══════════════════════════════════════════════════════
// 카드 5: CTA  (HTML .s5 기반)
// ══════════════════════════════════════════════════════
function CtaCard({ today }: { today: ReturnType<typeof loadToday> }) {
  const q1 = splitSlide(today.sl2).quote;
  const q2 = splitSlide(today.sl3).quote;
  const q3 = splitSlide(today.sl4).quote;

  return (
    <Shell bg={C.pk}>
      {/* 원1: right:-28 top:-28 w:130 h:130 → right:-89 top:-89 w:413 h:413 */}
      <div style={{
        position: 'absolute', right: -89, top: -89,
        width: 413, height: 413, borderRadius: '50%',
        background: C.pkDeep, opacity: 0.3, display: 'flex',
      }} />
      {/* 원2: left:-20 bottom:-20 w:100 h:100 → left:-64 bottom:-64 w:318 h:318 */}
      <div style={{
        position: 'absolute', left: -64, bottom: -64,
        width: 318, height: 318, borderRadius: '50%',
        background: C.pkDeep, opacity: 0.22, display: 'flex',
      }} />
      {/* 🌟: top:20 right:24 fs:24 → top:64 right:76 fs:76 */}
      <div style={{
        position: 'absolute', top: 64, right: 76,
        fontSize: 76, display: 'flex', transform: 'rotate(15deg)',
      }}>🌟</div>

      {/* 전체: padding 28 24 → 89 76, justify:space-between */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        flex: 1, padding: '89px 76px',
        justifyContent: 'space-between',
      }}>

        {/* 상단 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* SUMMARY 레이블: fs:10 w:600 rgba(255,255,255,.5) ls:.16em mb:14 → fs:32 mb:44 */}
          <span style={{
            fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.16em', marginBottom: 44, fontFamily: 'body',
          }}>
            TODAY'S SUMMARY
          </span>

          {/* 흰 카드: br:14 padding:18 20 mb:18 → br:44 padding:57 64 mb:57 */}
          <div style={{
            background: C.white, borderRadius: 44,
            padding: '57px 64px', marginBottom: 57,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 카드 헤더: fs:11 w:600 #BBA090 ls:.04em mb:14 → fs:35 mb:44 */}
            <span style={{
              fontSize: 35, fontWeight: 600, color: C.gray,
              letterSpacing: '0.04em', marginBottom: 44, fontFamily: 'body',
            }}>
              오늘 기억할 3가지 🍒
            </span>

            {/* 항목들 */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>

              {/* 항목 1: gap:12 padding:6 → gap:38 padding:19 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 38, paddingTop: 19, paddingBottom: 19 }}>
                {/* num: fs:11 w:800 #D94040 w:18 → fs:35 w:57 */}
                <span style={{ fontSize: 35, fontWeight: 700, color: C.pk, width: 57, flexShrink: 0, fontFamily: 'display' }}>01</span>
                {/* text: fs:13 w:600 #1A1A1A → fs:41 */}
                <span style={{ fontSize: 41, fontWeight: 600, color: C.dark, fontFamily: 'body', wordBreak: 'keep-all' }}>
                  {q1} 🚫
                </span>
              </div>
              {/* sep: h:1 → h:3 */}
              <div style={{ height: 3, background: '#F5E8E8', display: 'flex' }} />

              {/* 항목 2 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 38, paddingTop: 19, paddingBottom: 19 }}>
                <span style={{ fontSize: 35, fontWeight: 700, color: C.pk, width: 57, flexShrink: 0, fontFamily: 'display' }}>02</span>
                <span style={{ fontSize: 41, fontWeight: 600, color: C.dark, fontFamily: 'body', wordBreak: 'keep-all' }}>
                  {q2} 🚫
                </span>
              </div>
              <div style={{ height: 3, background: '#F5E8E8', display: 'flex' }} />

              {/* 항목 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 38, paddingTop: 19, paddingBottom: 19 }}>
                <span style={{ fontSize: 35, fontWeight: 700, color: C.pk, width: 57, flexShrink: 0, fontFamily: 'display' }}>03</span>
                <span style={{ fontSize: 41, fontWeight: 600, color: C.dark, fontFamily: 'body', wordBreak: 'keep-all' }}>
                  {q3} 🚫
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* 하단 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* 메인: fs:19 w:800 #fff lh:1.35 mb:8 → fs:60 mb:25 */}
          <span style={{
            fontSize: 60, fontWeight: 700, color: C.white,
            lineHeight: 1.35, marginBottom: 25, fontFamily: 'display', wordBreak: 'keep-all',
          }}>
            {today.sl5.length > 28 ? today.sl5.slice(0, 28) + '…' : today.sl5}
          </span>
          {/* 서브: fs:12 w:400 rgba(255,255,255,.75) mb:14 → fs:38 mb:44 */}
          <span style={{
            fontSize: 38, fontWeight: 400, color: 'rgba(255,255,255,0.75)',
            marginBottom: 44, fontFamily: 'body',
          }}>
            📌 저장해두고 오늘 저녁 확인해요
          </span>
          {/* 팔로우 버튼: border:1.5px solid rgba(255,255,255,.55) br:24 padding:8 20 */}
          <div style={{
            display: 'flex', alignSelf: 'flex-start',
            borderTop: '5px solid rgba(255,255,255,0.55)',
            borderBottom: '5px solid rgba(255,255,255,0.55)',
            borderLeft: '5px solid rgba(255,255,255,0.55)',
            borderRight: '5px solid rgba(255,255,255,0.55)',
            borderRadius: 76, paddingTop: 25, paddingBottom: 25,
            paddingLeft: 64, paddingRight: 64,
          }}>
            {/* fs:11 w:600 #fff ls:.06em → fs:35 */}
            <span style={{ fontSize: 35, fontWeight: 600, color: C.white, letterSpacing: '0.06em', fontFamily: 'body' }}>
              팔로우 → 매주 새 콘텐츠
            </span>
          </div>
        </div>

      </div>
    </Shell>
  );
}

// ── GET 핸들러 ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const cardNum = parseInt(new URL(request.url).searchParams.get('card') ?? '1', 10);
    if (cardNum < 1 || cardNum > 5) {
      return new Response('card 파라미터는 1~5 사이여야 합니다.', { status: 400 });
    }

    const today    = loadToday();
    const fontBold = loadFont('Pretendard-Bold.otf');
    const fontReg  = loadFont('Pretendard-Regular.otf');

    const fonts = [
      { name: 'display', data: fontBold, weight: 700 as const, style: 'normal' as const },
      { name: 'body',    data: fontReg,  weight: 400 as const, style: 'normal' as const },
    ];

    const slides: Record<number, React.ReactElement> = {
      1: <CoverCard today={today} />,
      2: <ContentCard num="01" label="첫 번째 금지어" sticker="😬" rotateDeg="-10deg" slideText={today.sl2} pageLabel="2 / 5" />,
      3: <ContentCard num="02" label="두 번째 금지어" sticker="😢" rotateDeg="8deg"   slideText={today.sl3} pageLabel="3 / 5" />,
      4: <ContentCard num="03" label="세 번째 금지어" sticker="😤" rotateDeg="-6deg"  slideText={today.sl4} pageLabel="4 / 5" />,
      5: <CtaCard today={today} />,
    };

    const imgRes = new ImageResponse(slides[cardNum], { width: W, height: H, fonts });
    const buf    = await imgRes.arrayBuffer();

    if (buf.byteLength < 1000) {
      return new Response(`이미지 렌더링 실패 (card ${cardNum}, ${buf.byteLength} bytes)`, { status: 500 });
    }

    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[planb-image] 오류:', msg);
    return new Response(`이미지 생성 실패: ${msg}`, { status: 500 });
  }
}
