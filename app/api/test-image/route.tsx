import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    <div style={{ background: 'green', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'white', fontSize: 32 }}>OK</span>
    </div>,
    { width: 200, height: 200 }
  );
}
