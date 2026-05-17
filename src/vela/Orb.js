import { t } from './theme';

export default function Orb({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, #b0acee, ${t.accent} 55%, #3a369e)`,
      boxShadow: `0 0 ${Math.round(size / 2)}px rgba(127,119,221,0.45)`,
    }} />
  );
}
