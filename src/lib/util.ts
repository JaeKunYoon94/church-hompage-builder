import { CHURCH, COLORS, DEFAULT_BANNER, KEY, STARTER_BLOCKS, STAFF, TYPES, WORSHIP } from '../constants';
import { SAMPLE_BANNER } from './bannerImage';
import { SAMPLE } from './sampleImages';
import type { AppData, Block, BlockType, Bulletin, Doc, Place, Privacy } from '../types';

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

const now = new Date();
export const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
/** "2026-10-11" → "2026년 10월 11일" (anything else is shown as typed) */
export const md = (d?: string) => { const p = String(d || '').split('-'); return p.length === 3 ? `${+p[0]}년 ${+p[1]}월 ${+p[2]}일` : String(d ?? ''); };
export const safeImg = (u: unknown): string => (typeof u === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u)) ? u : '';

// ponytail: photo stored as a data URL in localStorage; the real service uploads to Storage and keeps a URL
export function shrink(file: File, max = 1600, type = 'image/jpeg'): Promise<string> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'), ctx = c.getContext('2d')!;
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(src);
      resolve(c.toDataURL(type, 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('unreadable')); };
    img.src = src;
  });
}

// ---- YouTube ----
/** youtu.be/ID, youtube.com/watch?v=ID, /live/ID, /shorts/ID, /embed/ID (also youtube-nocookie.com) → the 11-char video id, else '' */
export function ytId(raw: string): string {
  let s = String(raw || '').trim(), u: URL;
  if (s.startsWith('//')) s = 'https:' + s;
  else if (s && !/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { u = new URL(s); } catch { return ''; }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id = '';
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') id = u.searchParams.get('v') || (u.pathname.match(/^\/(?:live|shorts|embed)\/([^/?#]+)/) || [])[1] || '';
  return /^[\w-]{11}$/.test(id) ? id : '';
}
/** takes YouTube's 퍼가기 <iframe> code or a plain link; only the video id survives, the pasted HTML is never put on the page */
export function ytFromInput(raw: string): string {
  const s = String(raw || '').trim(), m = s.match(/<iframe\b[^>]*?\ssrc\s*=\s*["']([^"']+)["']/i);
  return /<iframe\b/i.test(s) ? (m ? ytId(m[1]) : '') : ytId(s);
}
export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
/** YouTube's oEmbed answers browser requests directly (CORS), no API key needed */
export async function ytInfo(id: string): Promise<{ title?: string; author_name?: string }> {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(ytWatch(id))}`);
  if (!r.ok) throw new Error('oembed ' + r.status);
  return r.json();
}

// ---- document accessors (every one tolerates old saves that lack the field) ----
export const nameOf = (doc?: Doc | null) => (doc && doc.name) || CHURCH.name;
/** a preset key or a custom #rrggbb picked by the church; anything else falls back to the default */
export const accentOf = (doc?: Doc | null): string => { const c = doc && doc.color; return c && COLORS[c] ? COLORS[c].v : /^#[0-9a-f]{6}$/i.test(c || '') ? c! : COLORS.sky.v; };
/** WCAG contrast of white text on this color; under 4.5 the hero and buttons get hard to read */
export const contrastOnWhite = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
};
export const worshipOf = (doc?: Doc | null): string[][] => (doc && Array.isArray(doc.worship)) ? doc.worship : WORSHIP;
export const pagesOf = (b?: Bulletin | null): string[] => (b && Array.isArray(b.pages) ? b.pages : []).filter(safeImg);
export const placeOf = (doc?: Doc | null): Place => ({ addr: CHURCH.addr, transit: CHURCH.transit, parking: CHURCH.parking, phone: CHURCH.phone, ...(doc && doc.place) });
export const privacyOf = (doc?: Doc | null): Privacy => ({ officer: '이○○ 부목사', contact: CHURCH.phone, effective: today, ...(doc && doc.privacy) });

/** search-by-address links; tmap:// only opens where the T map app is installed */
export const mapLinks = (addr: string) => {
  const q = encodeURIComponent(String(addr || '').trim());
  return { naver: `https://map.naver.com/p/search/${q}`, kakao: `https://map.kakao.com/link/search/${q}`, tmap: `tmap://search?name=${q}` };
};

// ---- blocks and starting data ----
let seq = 0;
const nid = () => 'b' + Date.now().toString(36) + (seq++);
export const mk = (type: BlockType): Block => ({ id: nid(), type, hidden: false, props: clone(TYPES[type].props) });

export function sample(): AppData {
  const draft: Doc = { name: '새빛교회', color: 'green', worship: clone(WORSHIP), privacy: privacyOf(null), blocks: STARTER_BLOCKS.map(mk) };
  return {
    draft, published: clone(draft), prev: null,
    sermons: [
      { title: '두려워하지 말라', verse: '이사야 41:10', preacher: '김○○ 목사', date: '2026-10-11', vid: '44xxa7XY7_8', url: 'https://www.youtube.com/watch?v=44xxa7XY7_8' },
      { title: '범사에 감사하라', verse: '데살로니가전서 5:16-18', preacher: '김○○ 목사', date: '2026-10-04' },
      { title: '씨 뿌리는 비유', verse: '마가복음 4:1-9', preacher: '이○○ 목사', date: '2026-09-27' }
    ],
    banners: [{ ...DEFAULT_BANNER, image: SAMPLE_BANNER, title: '', sub: '', btn: '', dim: 'low' }], // the photo carries its own headline
    bulletins: [
      { title: '2026년 10월 둘째 주 주보', date: '2026-10-11', file: 'sample-bulletin-2026-10-11.pdf', pages: [...SAMPLE.bulletin1], pageCount: SAMPLE.bulletin1.length },
      { title: '2026년 10월 첫째 주 주보', date: '2026-10-04', file: 'sample-bulletin-2026-10-04.pdf', pages: [...SAMPLE.bulletin2], pageCount: SAMPLE.bulletin2.length }
    ],
    staff: STAFF.map(([name, role]) => ({ name, role })),
    notices: [
      { title: '추수감사주일 연합 예배 안내', date: '2026-10-11', body: '2026년 10월 18일 추수감사주일에는 1부와 2부를 합쳐 오전 11시에 연합 예배로 드립니다.\n예배 후 친교실에서 함께 점심을 나눕니다.' },
      { title: '가을 성경 공부반 등록 (2026년 10월 25일까지)', date: '2026-10-04', body: '마가복음을 함께 읽는 8주 과정입니다.\n2026년 10월 25일까지 교회 사무실이나 문의·새가족 등록 양식으로 신청해 주세요.' },
      { title: '주차장 공사로 인한 임시 주차 안내', date: '2026-09-27', body: '주차장 바닥 공사로 2026년 10월 31일까지 교회 앞 주차장을 쓸 수 없습니다.\n주일에는 옆 학교 운동장을 이용해 주세요.' }
    ],
    gallery: SAMPLE.gallery.map(g => ({ ...g }))
  };
}

/** Saved data → AppData. Old saves are repaired here, so change the data shape only together with a fix-up below. */
export function loadData(): AppData {
  let raw: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any -- legacy shapes
  try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { raw = null; }
  const data: any = raw && raw.draft && Array.isArray(raw.draft.blocks) ? raw : sample(); // eslint-disable-line @typescript-eslint/no-explicit-any
  const base = sample();
  if (!Array.isArray(data.gallery)) data.gallery = [];
  (['bulletins', 'staff', 'sermons', 'notices'] as const).forEach(k => { if (!Array.isArray(data[k])) data[k] = base[k]; }); // drafts saved before these menus existed
  base.notices.forEach(s => { const n = data.notices.find((x: any) => !x.body && String(x.title).startsWith(s.title.slice(0, 8))); if (n) n.body = s.body; }); // eslint-disable-line @typescript-eslint/no-explicit-any -- example notices saved before they had text
  if (!data.banner && !data.banners) { const h = data.draft.blocks.find((b: Block) => b.type === 'hero'); data.banner = { ...DEFAULT_BANNER, ...(h && h.props) }; } // banner used to live on the hero block
  if (!Array.isArray(data.banners) || !data.banners.length) data.banners = [{ ...DEFAULT_BANNER, ...(data.banner || {}) }]; // one banner became a list
  delete data.banner;
  if (data.prev === undefined) data.prev = null;
  if (!data.published) data.published = clone(data.draft);
  // retired fields still sitting in old saves (약도 images, banner photos copied on hero blocks) — drop them to free browser storage
  [data.draft, data.published, data.prev].forEach((d: Doc | null) => {
    if (!d) return;
    if (d.place) delete (d.place as Record<string, unknown>).mapImg;
    (d.blocks || []).forEach(b => { if (b.type === 'hero') b.props = {}; });
  });
  return data as AppData;
}
