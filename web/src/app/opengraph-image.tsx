import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '한자 공부 - 초등 한자 키즈 학습';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 20 }}>🐉</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: '#0c4a6e',
            letterSpacing: '-0.02em',
          }}
        >
          한자 공부
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#0369a1',
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          초등 한자(어문회 8급~4급Ⅱ) 키즈 학습
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 32,
            fontSize: 20,
            color: '#0284c7',
          }}
        >
          <span>📚 900자</span>
          <span>·</span>
          <span>🎯 퀴즈+함정문제</span>
          <span>·</span>
          <span>📱 모바일 최적화</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
