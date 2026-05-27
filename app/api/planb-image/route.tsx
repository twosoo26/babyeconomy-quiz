import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1350;

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

// ── 카드 1: 커버 ────────────────────────────────────────────
function CoverCard({ today }: { today: ReturnType<typeof loadToday> }) {
  const num = String(today.number).padStart(3, '0');
  const titleLen = today.title.length;
  const titleSize = titleLen > 22 ? (titleLen > 30 ? 76 : 92) : 116;

  return (
    <Shell bg={C.cream}>
      {/* 장식 이모지 */}
      <div style={{ position: 'absolute', top: 178, right: 57, fontSize: 57,
        lineHeight: 1, opacity: 0.6, display: 'flex', transform: 'rotate(-8deg)' }}>⭐</div>
      <div style={{ position: 'absolute', right: 83, bottom: 220, fontSize: 70,
        lineHeight: 1, opacity: 0.65, display: 'flex', transform: 'rotate(6deg)' }}>🍒</div>

      {/* 상단 콘텐츠 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '95px 89px 0' }}>
        {/* 시리즈 레이블 */}
        <span style={{
          fontSize: 32, fontWeight: 600, color: C.gray,
          letterSpacing: 5, marginBottom: 70, fontFamily: 'body',
        }}>
          {num} — 엄마표 경제교육
        </span>

        {/* sl1 소제목 */}
        <span style={{
          fontSize: 44, fontWeight: 500, color: C.gray,
          marginBottom: 26, fontFamily: 'body',
        }}>
          {today.sl1}
        </span>

        {/* 메인 타이틀 */}
        <span style={{
          fontSize: titleSize, fontWeight: 800, color: C.dark,
          lineHeight: 1.1, letterSpacing: -4, fontFamily: 'display',
          wordBreak: 'keep-all',
        }}>
          {today.title}
        </span>

        {/* 포인트 라인 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 51 }}>
          <div style={{ width: 114, height: 10, background: C.pk, borderRadius: 5, display: 'flex' }} />
          <span style={{ fontSize: 41, fontWeight: 700, color: C.pk, fontFamily: 'body' }}>
            지금 확인해보세요 👇
          </span>
        </div>
      </div>

      {/* 하단 체리 블록 */}
      <div style={{
        background: C.pk, padding: '48px 89px', flexShrink: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 41, fontWeight: 700, color: C.white, fontFamily: 'body' }}>
          혹시 이 말 하고 계신가요? 👀
        </span>
        <span style={{ fontSize: 57, display: 'flex' }}>👇</span>
      </div>
    </Shell>
  );
}

// ── 카드 2·3·4: 본문 ─────────────────────────────────────────
function ContentCard({
  today, num, label, sticker, rotate, titleText, bodyText, pageTitle,
}: {
  today: ReturnType<typeof loadToday>;
  num: string; label: string; sticker: string; rotate: string;
  titleText: string; bodyText: string; pageTitle: string;
}) {
  const titleLen = titleText.length;
  const titleSize = titleLen > 14 ? (titleLen > 20 ? 56 : 66) : 76;

  return (
    <Shell bg={C.white}>
      {/* 감정 이모지 스티커 */}
      <div style={{
        position: 'absolute', top: 51, right: 64,
        fontSize: 70, opacity: 0.7, display: 'flex',
        transform: `rotate(${rotate})`,
      }}>
        {sticker}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '95px 83px 0' }}>
        {/* 상단 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 38, marginBottom: 64 }}>
          {/* 대형 번호 */}
          <span style={{
            fontSize: 159, fontWeight: 800, color: C.pkPale,
            lineHeight: 1, flexShrink: 0, marginTop: -6, fontFamily: 'display',
          }}>
            {num}
          </span>
          {/* 레이블 + 제목 */}
          <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 6 }}>
            <span style={{
              fontSize: 32, fontWeight: 600, color: C.pk,
              letterSpacing: 4, marginBottom: 19, fontFamily: 'body',
            }}>
              {label}
            </span>
            <span style={{
              fontSize: titleSize, fontWeight: 800, color: C.dark,
              letterSpacing: -2, fontFamily: 'display', wordBreak: 'keep-all',
            }}>
              {titleText}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 3, background: '#F5E8E8', marginBottom: 57, display: 'flex' }} />

        {/* 설명 박스 */}
        <div style={{ background: C.pkLight, borderRadius: 38, padding: '51px 57px' }}>
          <span style={{
            fontSize: 35, fontWeight: 700, color: C.pkDeep,
            marginBottom: 25, fontFamily: 'body', display: 'flex',
          }}>
            왜 안 될까요?
          </span>
          <span style={{
            fontSize: 45, fontWeight: 400, color: '#3A3A3A',
            lineHeight: 1.85, fontFamily: 'body', wordBreak: 'keep-all',
          }}>
            {bodyText}
          </span>
        </div>
      </div>

      {/* 페이지 번호 */}
      <div style={{
        position: 'absolute', bottom: 57, right: 76,
        fontSize: 32, fontWeight: 600, color: '#ECC8C8',
        letterSpacing: 3, fontFamily: 'body', display: 'flex',
      }}>
        {pageTitle}
      </div>
    </Shell>
  );
}

// ── 카드 5: CTA ─────────────────────────────────────────────
function CtaCard({ today }: { today: ReturnType<typeof loadToday> }) {
  const items = [today.sl2, today.sl3, today.sl4];

  return (
    <Shell bg={C.pk}>
      {/* 배경 원 장식 */}
      <div style={{
        position: 'absolute', right: -89, top: -89,
        width: 413, height: 413, borderRadius: '50%',
        background: C.pkDeep, opacity: 0.3, display: 'flex',
      }} />
      <div style={{
        position: 'absolute', left: -64, bottom: -64,
        width: 318, height: 318, borderRadius: '50%',
        background: C.pkDeep, opacity: 0.22, display: 'flex',
      }} />
      <div style={{
        position: 'absolute', top: 64, right: 76,
        fontSize: 76, display: 'flex', transform: 'rotate(15deg)',
      }}>🌟</div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1,
        padding: '89px 76px 0', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* SUMMARY 레이블 */}
          <span style={{
            fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
            letterSpacing: 5, marginBottom: 44, fontFamily: 'body',
          }}>
            TODAY'S SUMMARY
          </span>

          {/* 흰 요약 카드 */}
          <div style={{
            background: C.white, borderRadius: 44,
            padding: '57px 64px', marginBottom: 57,
            display: 'flex', flexDirection: 'column',
          }}>
            <span style={{
              fontSize: 35, fontWeight: 600, color: C.gray,
              letterSpacing: 2, marginBottom: 44, fontFamily: 'body',
            }}>
              오늘 기억할 3가지 🍒
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((text, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 38, padding: '19px 0' }}>
                    <span style={{
                      fontSize: 35, fontWeight: 800, color: C.pk,
                      width: 57, flexShrink: 0, fontFamily: 'display',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: 41, fontWeight: 600, color: C.dark,
                      fontFamily: 'body', wordBreak: 'keep-all',
                    }}>
                      {text.length > 20 ? text.slice(0, 20) + '…' : text}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{ height: 3, background: '#F5E8E8', display: 'flex' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 텍스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 89 }}>
          <span style={{
            fontSize: 60, fontWeight: 800, color: C.white,
            lineHeight: 1.35, marginBottom: 25, fontFamily: 'display',
            wordBreak: 'keep-all',
          }}>
            {today.sl5.length > 30 ? today.sl5.slice(0, 30) + '…' : today.sl5}
          </span>
          <span style={{
            fontSize: 38, fontWeight: 400, color: 'rgba(255,255,255,0.75)',
            marginBottom: 44, fontFamily: 'body',
          }}>
            📌 저장해두고 오늘 확인해요
          </span>
          <div style={{
            display: 'flex', alignSelf: 'flex-start',
            border: '5px solid rgba(255,255,255,0.55)',
            borderRadius: 76, padding: '25px 64px',
          }}>
            <span style={{
              fontSize: 35, fontWeight: 600, color: C.white,
              letterSpacing: 2, fontFamily: 'body',
            }}>
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
      2: <ContentCard today={today} num="01" label="첫 번째 금지어" sticker="😬" rotate="-10deg"
           titleText={today.sl2} bodyText={today.sl2} pageTitle="2 / 5" />,
      3: <ContentCard today={today} num="02" label="두 번째 금지어" sticker="😢" rotate="8deg"
           titleText={today.sl3} bodyText={today.sl3} pageTitle="3 / 5" />,
      4: <ContentCard today={today} num="03" label="세 번째 금지어" sticker="😤" rotate="-6deg"
           titleText={today.sl4} bodyText={today.sl4} pageTitle="4 / 5" />,
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
