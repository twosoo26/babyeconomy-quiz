import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1350;

// ── 컬러 팔레트 (체리 레드 × 크림) ──────────────────────────
const C = {
  cherry:     '#D94040',
  cherryDeep: '#B53030',
  cherryPale: '#F8DADA',
  cherryBg:   '#FFF4F4',
  cream:      '#FDF8F5',
  dark:       '#1A1A1A',
  gray:       '#757575',
  white:      '#FFFFFF',
  yellow:     '#FFD600',
};

function loadFont(filename: string): ArrayBuffer {
  const buf = readFileSync(path.join(process.cwd(), 'public', 'fonts', filename));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// 파일 읽기 (force-dynamic이므로 런타임에 읽음)
function loadToday() {
  const raw = readFileSync(path.join(process.cwd(), 'data', 'today-planb.json'), 'utf-8');
  return JSON.parse(raw) as {
    date: string; number: number; title: string;
    sl1: string; sl2: string; sl3: string; sl4: string; sl5: string; caption: string;
  };
}

// ── 공통 외곽 ────────────────────────────────────────────────
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

// ── 하단 브랜드 바 ───────────────────────────────────────────
function BrandBar({ light = false, date = '' }: { light?: boolean; date?: string }) {
  const d = date.replace(/-/g, '.');
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 72px', height: 88, flexShrink: 0,
      borderTop: `1px solid ${light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.18)'}`,
    }}>
      <span style={{ color: light ? C.gray : 'rgba(255,255,255,0.55)', fontSize: 25, letterSpacing: 2, fontFamily: 'body' }}>
        {d}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, background: C.yellow, borderRadius: 2, display: 'flex' }} />
        <span style={{ color: light ? C.cherry : C.white, fontSize: 23, fontWeight: 700, letterSpacing: 4, fontFamily: 'body' }}>
          엄마표 경제교육
        </span>
      </div>
    </div>
  );
}

// ── 카드 1: 커버 ────────────────────────────────────────────
function CoverCard({ today }: { today: ReturnType<typeof loadToday> }) {
  return (
    <Shell bg={C.cream}>
      {/* 장식 이모지 */}
      <div style={{ position: 'absolute', top: 24, right: -10, fontSize: 280, lineHeight: 1, opacity: 0.12, display: 'flex' }}>⭐</div>
      <div style={{ position: 'absolute', bottom: 80, left: -20, fontSize: 200, lineHeight: 1, opacity: 0.09, display: 'flex' }}>🍒</div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '110px 80px 0', position: 'relative' }}>
        {/* 시리즈 번호 */}
        <span style={{ fontSize: 22, color: C.gray, fontFamily: 'body', letterSpacing: 3, marginBottom: 32 }}>
          #{String(today.number).padStart(3, '0')} · 엄마표 경제교육
        </span>

        {/* 메인 타이틀 */}
        <span style={{
          fontSize: 68, fontWeight: 700, color: C.dark,
          lineHeight: 1.15, fontFamily: 'display',
          wordBreak: 'keep-all', marginBottom: 48,
          letterSpacing: -1.5,
        }}>
          {today.title}
        </span>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ width: 48, height: 4, background: C.cherry, borderRadius: 2, display: 'flex' }} />
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.10)', display: 'flex' }} />
        </div>

        {/* 후킹 문구 */}
        <div style={{
          background: C.cherry, borderRadius: 14,
          padding: '22px 36px', alignSelf: 'flex-start',
          display: 'flex',
        }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.white, fontFamily: 'body' }}>
            혹시 이 말 하고 계신가요? 👀👇
          </span>
        </div>
      </div>

      <BrandBar light date={today.date} />
    </Shell>
  );
}

// ── 카드 2~4: 본문 ───────────────────────────────────────────
function ContentCard({
  today, num, label, title, body,
}: {
  today: ReturnType<typeof loadToday>;
  num: number; label: string; title: string; body: string;
}) {
  // 이모지 스티커 (슬라이드마다 다름)
  const stickers = ['😬', '💡', '🙌'];
  const sticker  = stickers[(num - 2) % stickers.length];

  return (
    <Shell bg={C.white}>
      {/* 우상단 이모지 스티커 */}
      <div style={{
        position: 'absolute', top: 36, right: 48,
        fontSize: 80, opacity: 0.7, display: 'flex',
        transform: num % 2 === 0 ? 'rotate(-8deg)' : 'rotate(6deg)',
      }}>
        {sticker}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px 80px 0' }}>
        {/* 번호 + 레이블 + 제목 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 32 }}>
          <span style={{ fontSize: 80, fontWeight: 700, color: C.cherryPale, fontFamily: 'display', lineHeight: 1, flexShrink: 0 }}>
            {String(num - 1).padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.cherry, letterSpacing: 3, fontFamily: 'body' }}>
              {label.toUpperCase()}
            </span>
            <span style={{ fontSize: 38, fontWeight: 700, color: C.dark, fontFamily: 'display', lineHeight: 1.2, wordBreak: 'keep-all' }}>
              {title}
            </span>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 1, background: '#F5E8E8', marginBottom: 32, display: 'flex' }} />

        {/* 설명 박스 */}
        <div style={{
          background: C.cherryBg, borderRadius: 16,
          padding: '32px 40px', flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.cherryDeep, fontFamily: 'body', marginBottom: 16 }}>
            핵심 포인트
          </span>
          <span style={{
            fontSize: 34, color: C.dark, lineHeight: 1.85,
            fontFamily: 'body', fontWeight: 400, wordBreak: 'keep-all',
          }}>
            {body}
          </span>
        </div>

        {/* 페이지 번호 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, paddingBottom: 8 }}>
          <span style={{ fontSize: 22, color: C.gray, fontFamily: 'body' }}>
            {num - 1} / 4
          </span>
        </div>
      </div>

      <BrandBar light date={today.date} />
    </Shell>
  );
}

// ── 카드 5: CTA ─────────────────────────────────────────────
function CtaCard({ today }: { today: ReturnType<typeof loadToday> }) {
  return (
    <Shell bg={C.cherry}>
      {/* 배경 원 장식 */}
      <div style={{
        position: 'absolute', top: -120, right: -120,
        width: 480, height: 480, borderRadius: '50%',
        background: C.cherryDeep, opacity: 0.3, display: 'flex',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -80,
        width: 320, height: 320, borderRadius: '50%',
        background: C.cherryDeep, opacity: 0.22, display: 'flex',
      }} />
      <div style={{ position: 'absolute', top: 32, right: 48, fontSize: 56, opacity: 0.9, display: 'flex' }}>🌟</div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px 80px 0', position: 'relative' }}>
        {/* SUMMARY 레이블 */}
        <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 5, fontFamily: 'body', marginBottom: 36 }}>
          SUMMARY
        </span>

        {/* 요약 카드 */}
        <div style={{
          background: C.white, borderRadius: 20,
          padding: '36px 44px', marginBottom: 48,
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.cherry, fontFamily: 'body', letterSpacing: 2 }}>
            오늘의 핵심 3가지
          </span>
          {[today.sl2, today.sl3, today.sl4].map((text, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: C.cherry, fontFamily: 'display', flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 28, color: C.dark, lineHeight: 1.5, fontFamily: 'body', wordBreak: 'keep-all' }}>
                {text.slice(0, 45)}{text.length > 45 ? '…' : ''}
              </span>
            </div>
          ))}
        </div>

        {/* CTA 문구 */}
        <span style={{ fontSize: 38, fontWeight: 700, color: C.white, fontFamily: 'display', lineHeight: 1.3, wordBreak: 'keep-all', marginBottom: 20 }}>
          {today.sl5.slice(0, 60)}{today.sl5.length > 60 ? '…' : ''}
        </span>
        <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.75)', fontFamily: 'body' }}>
          매주 엄마표 경제교육 콘텐츠 업로드 중
        </span>
      </div>

      <BrandBar date={today.date} />
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

    const elements: Record<number, React.ReactElement> = {
      1: <CoverCard today={today} />,
      2: <ContentCard today={today} num={2} label="NG 대화" title={today.sl2.split('\n')[0] ?? today.sl2} body={today.sl2} />,
      3: <ContentCard today={today} num={3} label="대화 시작" title={today.sl3.split('\n')[0] ?? today.sl3} body={today.sl3} />,
      4: <ContentCard today={today} num={4} label="실천 포인트" title={today.sl4.split('\n')[0] ?? today.sl4} body={today.sl4} />,
      5: <CtaCard today={today} />,
    };

    const imgRes = new ImageResponse(elements[cardNum], { width: W, height: H, fonts });
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
