import Image from 'next/image';
import todayData from '@/data/today.json';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? '';
const CARD_COUNT = 5;

export default function Home() {
  const cards = Array.from({ length: CARD_COUNT }, (_, i) => i + 1);
  const labels = ['커버', '문제', '힌트', '정답', '설명'];

  return (
    <main style={{ minHeight: '100vh', background: '#0F1A10', color: '#fff', fontFamily: 'sans-serif', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#FFD600', marginBottom: 8 }}>
            🌱 어린이 경제 퀴즈
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
            {todayData.date} · #{todayData.number} · {todayData.category}
          </p>
        </div>

        {/* 퀴즈 미리보기 */}
        <div style={{ background: '#1B5E20', borderRadius: 16, padding: '32px', marginBottom: 48 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 12 }}>오늘의 문제</p>
          <p style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>{todayData.quiz}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#FFD600', color: '#1A1A2E', padding: '8px 20px', borderRadius: 8, fontWeight: 900, fontSize: 22 }}>
              {todayData.answer}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>{todayData.explanation}</span>
          </div>
        </div>

        {/* 카드 이미지 그리드 */}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#4CAF50' }}>카드 이미지 미리보기</h2>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {cards.map((n) => (
            <div key={n} style={{ flex: '0 0 calc(20% - 16px)' }}>
              <p style={{ textAlign: 'center', color: '#FFD600', marginBottom: 8, fontSize: 15, fontWeight: 700 }}>
                {labels[n - 1]}
              </p>
              <img
                src={`${BASE}/api/card-image?card=${n}`}
                alt={`카드 ${n}`}
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            </div>
          ))}
        </div>

        {/* API 링크 */}
        <div style={{ marginTop: 48, padding: '24px', background: '#1A2E1A', borderRadius: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 12 }}>카드 이미지 URL</p>
          {cards.map((n) => (
            <p key={n} style={{ fontSize: 14, color: '#4CAF50', fontFamily: 'monospace', marginBottom: 6 }}>
              {BASE}/api/card-image?card={n}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
