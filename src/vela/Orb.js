import { t } from './theme';

export default function Orb({ size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${t.accent}, #006d8a)`,
      boxShadow: `0 0 ${Math.round(size / 2)}px ${t.accent}40`,
    }} />
  );
}
