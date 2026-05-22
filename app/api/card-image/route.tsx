import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import todayData from '@/data/today.json';

export const dynamic = 'force-dynamic';

const W = 1080;
const H = 1350;

const C = {
  greenDark:  '#1B5E20',
  greenMid:   '#2E7D32',
  greenLight: '#E8F5E9',
  greenAccent:'#4CAF50',
  yellow:     '#FFD600',
  yellowBg:   '#FFFDE7',
  orange:     '#E65100',
  white:      '#FFFFFF',
  dark:       '#1A1A2E',
  gray:       '#757575',
  grayLight:  '#F5F5F5',
};

function loadFont(filename: string): ArrayBuffer {
  const buf = readFileSync(path.join(process.cwd(), 'public', 'fonts', filename));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

// ── 공통 카드 외곽 ──────────────────────────────────────────
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

// ── 공통 하단 브랜드 바 ─────────────────────────────────────
function BrandBar({ light = false }: { light?: boolean }) {
  const d = todayData.date?.replace(/-/g, '.') ?? '';
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 72px', height: 88, flexShrink: 0,
      borderTop: `1px solid ${light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.15)'}`,
    }}>
      <span style={{ color: light ? C.gray : 'rgba(255,255,255,0.5)', fontSize: 26, letterSpacing: 2, fontFamily: 'body' }}>
        {d}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, background: C.yellow, borderRadius: 2, display: 'flex' }} />
        <span style={{ color: light ? C.greenMid : C.white, fontSize: 24, fontWeight: 700, letterSpacing: 5, fontFamily: 'body' }}>
          어린이 경제 퀴즈
        </span>
      </div>
    </div>
  );
}

// ── 카드 1: 커버 ────────────────────────────────────────────
function CoverCard() {
  const num = todayData.number ?? 1;
  const cat = todayData.category ?? '';
  return (
    <Shell bg={C.greenDark}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '100px 80px 0' }}>
        {/* 카테고리 뱃지 */}
        <div style={{
          display: 'flex', alignSelf: 'flex-start',
          background: C.yellow, borderRadius: 8,
          padding: '10px 24px', marginBottom: 48,
        }}>
          <span style={{ color: C.dark, fontSize: 28, fontWeight: 700, fontFamily: 'body' }}>
            {cat}
          </span>
        </div>

        {/* 퀴즈 번호 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
          <span style={{ color: C.yellow, fontSize: 52, fontWeight: 700, fontFamily: 'display' }}>
            #{String(num).padStart(3, '0')}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 32, fontFamily: 'body' }}>/ 100</span>
        </div>

        {/* 메인 타이틀 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 86, fontWeight: 700, color: C.white, lineHeight: 1.05, fontFamily: 'display' }}>
            오늘의
          </span>
          <span style={{ fontSize: 86, fontWeight: 700, color: C.yellow, lineHeight: 1.05, fontFamily: 'display' }}>
            경제 퀴즈!
          </span>
        </div>

        <div style={{ display: 'flex', marginTop: 64 }}>
          <span style={{ fontSize: 36, color: 'rgba(255,255,255,0.6)', fontFamily: 'body' }}>
            아이와 함께 맞혀보세요
          </span>
        </div>
      </div>

      <BrandBar />
    </Shell>
  );
}

// ── 카드 2: 문제 ────────────────────────────────────────────
function QuestionCard() {
  const quiz = todayData.quiz ?? '';
  const num  = todayData.number ?? 1;
  return (
    <Shell bg={C.greenLight}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px 80px 0' }}>

        {/* 상단 카드번호 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60 }}>
          <div style={{ width: 8, height: 52, background: C.greenMid, borderRadius: 4, flexShrink: 0, display: 'flex' }} />
          <span style={{ fontSize: 30, color: C.greenMid, fontWeight: 700, fontFamily: 'body', letterSpacing: 2 }}>
            문제 · #{num}
          </span>
        </div>

        {/* Q 마크 */}
        <span style={{ fontSize: 120, fontWeight: 700, color: C.greenMid, lineHeight: 1, fontFamily: 'display', marginBottom: 40 }}>
          Q.
        </span>

        {/* 문제 텍스트 */}
        <span style={{
          fontSize: 52, fontWeight: 700, color: C.dark,
          lineHeight: 1.45, fontFamily: 'display',
        }}>
          {quiz}
        </span>

        {/* 하단 힌트 텍스트 — flex:1 spacer 대신 marginTop 고정 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end', paddingBottom: 40 }}>
          <span style={{ fontSize: 30, color: C.gray, fontFamily: 'body' }}>
            다음 장에서 힌트 확인!
          </span>
        </div>
      </div>

      <BrandBar light />
    </Shell>
  );
}

// ── 카드 3: 힌트 ────────────────────────────────────────────
function HintCard() {
  return (
    <Shell bg={C.yellowBg}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px 80px 0', justifyContent: 'center', alignItems: 'center' }}>

        <span style={{ fontSize: 110, marginBottom: 32, display: 'flex' }}>🤔</span>

        <span style={{ fontSize: 72, fontWeight: 700, color: C.dark, lineHeight: 1.1, fontFamily: 'display', textAlign: 'center', marginBottom: 40 }}>
          잠깐!
        </span>

        <span style={{
          fontSize: 42, fontWeight: 700, color: C.greenMid,
          lineHeight: 1.4, fontFamily: 'display', textAlign: 'center',
        }}>
          3초 동안 정답을 생각해봐요
        </span>

        <div style={{ display: 'flex', gap: 16, marginTop: 64 }}>
          {['3', '2', '1'].map((n) => (
            <div key={n} style={{
              width: 72, height: 72, borderRadius: '50%',
              background: C.greenMid, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: C.white, fontFamily: 'display' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>
      <BrandBar light />
    </Shell>
  );
}

// ── 카드 4: 정답 ────────────────────────────────────────────
function AnswerCard() {
  const ans = todayData.answer ?? '';
  return (
    <Shell bg={C.greenMid}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '80px 80px 0', justifyContent: 'center', alignItems: 'center' }}>

        <span style={{ fontSize: 52, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'body', marginBottom: 32, letterSpacing: 4 }}>
          정 답 !
        </span>

        {/* 정답 텍스트 */}
        <div style={{
          background: C.yellow, borderRadius: 20,
          padding: '32px 64px', marginBottom: 48,
          display: 'flex',
        }}>
          <span style={{ fontSize: 96, fontWeight: 700, color: C.dark, fontFamily: 'display' }}>
            {ans}
          </span>
        </div>

        <span style={{ fontSize: 44, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: 'body' }}>
          맞혔나요?
        </span>
      </div>
      <BrandBar />
    </Shell>
  );
}

// ── 카드 5: 설명 ────────────────────────────────────────────
function ExplanationCard() {
  const { quiz, answer, explanation } = todayData;
  return (
    <Shell bg={C.white}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '72px 80px 0' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ width: 8, height: 52, background: C.greenMid, borderRadius: 4, display: 'flex' }} />
          <span style={{ fontSize: 30, color: C.greenMid, fontWeight: 700, fontFamily: 'body', letterSpacing: 2 }}>
            이렇게 이해해요!
          </span>
        </div>

        {/* 문제 + 정답 요약 */}
        <div style={{
          background: C.greenLight, borderRadius: 16,
          padding: '32px 40px', marginBottom: 40,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <span style={{ fontSize: 30, color: C.gray, fontFamily: 'body' }}>Q. {quiz}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28, color: C.gray, fontFamily: 'body' }}>A.</span>
            <span style={{ fontSize: 36, fontWeight: 700, color: C.greenMid, fontFamily: 'display' }}>{answer}</span>
          </div>
        </div>

        {/* 구분선 */}
        <div style={{ height: 2, background: C.greenMid, marginBottom: 36, display: 'flex' }} />

        {/* 설명 */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'flex-start',
        }}>
          <span style={{
            fontSize: 38, color: C.dark, lineHeight: 1.7,
            fontFamily: 'body', fontWeight: 400,
          }}>
            {explanation}
          </span>
        </div>

        {/* 해시태그 */}
        <div style={{ display: 'flex', paddingBottom: 16 }}>
          <span style={{ fontSize: 24, color: C.gray, fontFamily: 'body' }}>
            #초등경제교육 #어린이경제 #경제퀴즈 #용돈교육 #3040학부모
          </span>
        </div>
      </div>
      <BrandBar light />
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

    const fontBold = loadFont('Pretendard-Bold.otf');
    const fontReg  = loadFont('Pretendard-Regular.otf');

    const fonts = [
      { name: 'display', data: fontBold, weight: 700 as const, style: 'normal' as const },
      { name: 'body',    data: fontReg,  weight: 400 as const, style: 'normal' as const },
    ];

    const elements: Record<number, React.ReactElement> = {
      1: <CoverCard />,
      2: <QuestionCard />,
      3: <HintCard />,
      4: <AnswerCard />,
      5: <ExplanationCard />,
    };

    return new ImageResponse(elements[cardNum], { width: W, height: H, fonts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[card-image] 오류:', msg);
    return new Response(`이미지 생성 실패: ${msg}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
    });
  }
}
