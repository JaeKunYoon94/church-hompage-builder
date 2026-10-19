import type { ReactElement } from 'react';
import { safeImg } from '../lib/util';
import type { BlockType, Doc } from '../types';

// ponytail: simplified round marks in each brand's colors, not the official logo files; swap in the press-kit assets for launch
export const APP_ICONS: Record<'tmap' | 'naver' | 'kakao', ReactElement> = {
  tmap: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs><linearGradient id="g-tmap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF2D8D" /><stop offset=".5" stopColor="#7B4DFF" /><stop offset="1" stopColor="#00C2FF" /></linearGradient></defs>
      <circle cx="24" cy="24" r="24" fill="#fff" /><path d="M13 13h22v6.5h-7.6V36h-6.8V19.5H13z" fill="url(#g-tmap)" />
    </svg>
  ),
  naver: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#fff" /><path d="M24 8c-7.2 0-13 5.6-13 12.6C11 29.4 24 40 24 40s13-10.6 13-19.4C37 13.6 31.2 8 24 8z" fill="#03C75A" />
      <path d="M18.6 14.6h3.6l4 6.2v-6.2h3.6V26h-3.6l-4-6.2V26h-3.6z" fill="#fff" /><rect x="16" y="39" width="16" height="3" rx="1.5" fill="#4E7CFF" />
    </svg>
  ),
  kakao: (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#FEE500" /><path d="M24 9c-6.6 0-12 5.2-12 11.6C12 29 24 39 24 39s12-10 12-18.4C36 14.2 30.6 9 24 9z" fill="#1E88F5" /><circle cx="24" cy="20.5" r="4.5" fill="#fff" />
    </svg>
  )
};
export const APPS: ['tmap' | 'naver' | 'kakao', string][] = [['tmap', '티맵'], ['naver', '네이버지도'], ['kakao', '카카오맵']];

export const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
);
const ChurchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="11" y="1" width="2" height="7" /><rect x="8.5" y="3" width="7" height="2" /><path d="M12 8L20 13.5V23H14.5V18.5a2.5 2.5 0 0 0-5 0V23H4V13.5Z" /></svg>
);
/** uploaded logo if any, else the default church icon */
export function Logo({ doc }: { doc: Doc }) {
  const img = safeImg(doc.logo);
  return img ? <img className="s-logo" src={img} alt="" /> : <span className="s-logo"><ChurchIcon /></span>;
}

const line = (d: ReactElement) => <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
/** line icons for the phone tab bar (own drawings) */
export const TAB_ICONS: Partial<Record<BlockType, ReactElement>> = {
  worship: line(<><path d="M10 8h26a2 2 0 0 1 2 2v28H12a2 2 0 0 1-2-2z" /><path d="M10 36a2 2 0 0 1 2-2h26" /><path d="M24 14v12M19 18h10" /></>),
  notices: line(<><path d="M8 12h22v16H18l-6 6v-6H8z" /><path d="M34 20h6v14h-4v6l-6-6h-6v-4" /></>),
  bulletin: line(<><path d="M12 6h18l8 8v28H12z" /><path d="M30 6v8h8M18 22h14M18 28h14M18 34h8" /></>),
  sermons: line(<><rect x="6" y="10" width="36" height="26" rx="3" /><path d="M21 17l10 6-10 6z" /><path d="M6 42h36" /></>)
};
