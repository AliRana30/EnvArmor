import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: '#020617',
          color: '#e2e8f0',
          padding: '56px',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ fontSize: 28, color: '#34d399' }}>EnvArmor</div>
        <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, maxWidth: 1000 }}>
          Stop .env leaks before they happen.
        </div>
        <div style={{ fontSize: 34, color: '#86efac' }}>$X saved by blocked secret leaks</div>
      </div>
    ),
    size
  );
}
