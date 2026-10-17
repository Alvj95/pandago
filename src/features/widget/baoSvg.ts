import type { WidgetMood } from './widgetData';

const FUR = '#E4572E';
const DARK = '#8C2F14';
const CREAM = '#FFF4E6';
const INK = '#2A1A14';

/** La cara de Bao como SVG (los widgets de Android no pueden usar componentes de React Native). */
export function baoSvg(mood: WidgetMood): string {
  const eyes =
    mood === 'sleep'
      ? `<path d="M35 64 Q42 69 49 64" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M71 64 Q78 69 85 64" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`
      : mood === 'happy'
        ? `<path d="M36 64 Q42 56 48 64" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M72 64 Q78 56 84 64" stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>`
        : `<circle cx="42" cy="64" r="7" fill="${INK}"/><circle cx="78" cy="64" r="7" fill="${INK}"/><circle cx="44.5" cy="61" r="2.5" fill="#fff"/><circle cx="80.5" cy="61" r="2.5" fill="#fff"/>`;
  const mouth =
    mood === 'happy'
      ? `<path d="M48 84 Q60 100 72 84 Z" fill="${INK}"/>`
      : mood === 'sleep'
        ? `<ellipse cx="60" cy="86" rx="3" ry="2" fill="${INK}"/>`
        : `<path d="M52 90 Q60 84 68 90" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  const extra = mood === 'sleep' ? `<text x="92" y="28" font-size="18" font-weight="bold" fill="#7C8BD9">z</text><text x="104" y="16" font-size="13" font-weight="bold" fill="#7C8BD9">z</text>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<path d="M18 38 L26 8 L48 26 Z" fill="${FUR}"/><path d="M24 32 L28 16 L40 26 Z" fill="${CREAM}"/>
<path d="M102 38 L94 8 L72 26 Z" fill="${FUR}"/><path d="M96 32 L92 16 L80 26 Z" fill="${CREAM}"/>
<ellipse cx="60" cy="64" rx="48" ry="42" fill="${FUR}"/>
<ellipse cx="36" cy="52" rx="13" ry="9" fill="${CREAM}"/><ellipse cx="84" cy="52" rx="13" ry="9" fill="${CREAM}"/><ellipse cx="60" cy="84" rx="26" ry="18" fill="${CREAM}"/>
<path d="M38 64 Q34 78 42 90" stroke="${DARK}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M82 64 Q86 78 78 90" stroke="${DARK}" stroke-width="6" stroke-linecap="round" fill="none"/>
${eyes}<ellipse cx="60" cy="76" rx="6" ry="4.5" fill="${INK}"/>${mouth}
<ellipse cx="26" cy="78" rx="7" ry="4" fill="#FF8FA3" opacity="0.55"/><ellipse cx="94" cy="78" rx="7" ry="4" fill="#FF8FA3" opacity="0.55"/>
${extra}</svg>`;
}
