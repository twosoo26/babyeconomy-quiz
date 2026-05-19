import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '어린이 경제 퀴즈',
  description: '매일 하나씩, 아이와 함께하는 경제 퀴즈',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
