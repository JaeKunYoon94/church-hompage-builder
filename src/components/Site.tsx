import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';
import { BTN_TO, DEFAULT_BANNER, DIM, TABS, TYPES } from '../constants';
import { accentOf, md, mapLinks, nameOf, pagesOf, placeOf, safeImg, worshipOf, ytThumb, ytWatch } from '../lib/util';
import { useEd } from '../store';
import type { Banner, Block, Device, Doc, DocKind, GalleryItem, Lists, Props } from '../types';
import { APPS, APP_ICONS, CopyIcon, Logo, TAB_ICONS } from './icons';
import { DOC_TITLE, LegalDoc } from './Legal';

/** newline-separated text → lines with <br> between them (React escapes everything else) */
const Br = ({ text }: { text?: string }) => <>{String(text ?? '').split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</>;

// ---- hero: one renderer for the live site and the banner preview, so the preview never drifts from what visitors see ----
export function Hero({ banner, name }: { banner: Banner; name: string }) {
  const img = safeImg(banner.image), dim = DIM[banner.dim] ?? DIM.mid, to = banner.btnTo && BTN_TO[banner.btnTo] ? banner.btnTo : '', to2 = banner.btn2To && BTN_TO[banner.btn2To] ? banner.btn2To : '';
  const style: CSSProperties | undefined = img ? { backgroundImage: `linear-gradient(rgba(15,23,42,${dim}),rgba(15,23,42,${dim})),url(${img})` } : undefined;
  return (
    <div className={`s-hero${img ? ' has-photo' : ''}${banner.align === 'center' ? ' is-center' : ''}`} style={style}>
      <div className="s-hero-in">
        <p className="s-eyebrow">{name}</p>
        {banner.title && <h1 className="s-h1">{banner.title}</h1>}
        {banner.sub && <p className="s-lead">{banner.sub}</p>}
        {(banner.btn || banner.btn2) && (
          <div className="s-hero-btns">
            {banner.btn && (to ? <a className="s-btn" href={`#sec-${to}`}>{banner.btn}</a> : <span className="s-btn">{banner.btn}</span>)}
            {banner.btn2 && (to2 ? <a className="s-btn s-btn-ghost" href={`#sec-${to2}`}>{banner.btn2}</a> : <span className="s-btn s-btn-ghost">{banner.btn2}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** several banners stacked in one grid cell and cross-faded; hidden ones are inert so their buttons leave the tab order.
 *  Advances every 6 seconds on the live site only; never while pointed at or focused, never with reduced motion. */
function Slides({ banners, name, autoplay }: { banners: Banner[]; name: string; autoplay: boolean }) {
  const [i, setI] = useState(0), root = useRef<HTMLDivElement>(null), n = banners.length;
  const go = (k: number) => setI(((k % n) + n) % n);
  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => {
      if (document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches || root.current?.matches(':hover, :focus-within')) return;
      setI(c => (c + 1) % n);
    }, 6000);
    return () => clearInterval(t);
  }, [autoplay, n]);
  const cur = Math.min(i, n - 1);
  return (
    <div className="s-slides" ref={root} role="region" aria-roledescription="carousel" aria-label="대표 배너">
      <div className="s-track">
        {banners.map((b, k) => (
          <div key={k} className={`s-slide${k === cur ? ' on' : ''}`} role="group" aria-roledescription="slide" aria-label={`${k + 1} / ${n}`} inert={k !== cur}><Hero banner={b} name={name} /></div>
        ))}
      </div>
      <button type="button" className="s-arrow prev" onClick={() => go(cur - 1)} aria-label="이전 배너">‹</button>
      <button type="button" className="s-arrow next" onClick={() => go(cur + 1)} aria-label="다음 배너">›</button>
      <div className="s-dots">{banners.map((_, k) => <button key={k} type="button" onClick={() => go(k)} aria-label={`${k + 1}번째 배너`} aria-current={k === cur ? 'true' : undefined} />)}</div>
    </div>
  );
}

/** thumbnail first, player on press: nothing loads from YouTube until a visitor plays, and a blocked player never leaves an empty box */
function Video({ vid, title, editable }: { vid?: string; title: string; editable: boolean }) {
  const [playing, setPlaying] = useState(false), [thumbOk, setThumbOk] = useState(true);
  if (!vid) return <div className="s-thumb"><span className="s-play" aria-hidden="true">▶</span></div>;
  if (playing) return <div className="s-video"><iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`} title={title} allow="autoplay; encrypted-media; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>;
  return (
    <button type="button" className="s-video" aria-label={`${title} 영상 재생`} onClick={() => { if (!editable) setPlaying(true); }}>
      {thumbOk && <img src={ytThumb(vid)} alt="" loading="lazy" onError={() => setThumbOk(false)} />}<span className="s-play" aria-hidden="true">▶</span>
    </button>
  );
}

interface BodyProps { type: Block['type']; p: Props; doc: Doc; lists: Lists; editable: boolean }

function BlockBody({ type, p, doc, lists, editable }: BodyProps) {
  const ed = useEd();
  const title = <h2 className="s-h2">{p.title}</h2>;
  switch (type) {
    case 'hero': {
      const list = lists.banners.map(b => ({ ...DEFAULT_BANNER, ...b })), name = nameOf(doc);
      return list.length < 2 ? <Hero banner={list[0] || DEFAULT_BANNER} name={name} /> : <Slides banners={list} name={name} autoplay={!editable} />;
    }
    case 'worship': {
      const rows = worshipOf(doc).filter(r => r.some(x => String(x).trim()));
      return (
        <div className="s-wrap">{title}
          {rows.length ? (
            <table className="s-table"><thead><tr><th>예배</th><th>시간</th><th>장소</th></tr></thead>
              <tbody>{rows.map((w, i) => <tr key={i}><td>{w[0]}</td><td>{w[1]}</td><td>{w[2]}</td></tr>)}</tbody></table>
          ) : <p className="s-muted">등록된 예배 시간이 없습니다.</p>}
        </div>
      );
    }
    case 'sermons': {
      const list = lists.sermons.slice(0, +p.count || 3);
      if (!list.length) return <div className="s-wrap">{title}<p className="s-muted">등록된 설교가 없습니다.</p></div>;
      const [f, ...rest] = list;
      return (
        <div className="s-wrap">{title}
          <div className="s-sermons">
            <div>
              <Video vid={f.vid} title={f.title} editable={editable} />
              <p className="s-date">{md(f.date)} 주일</p><h3 className="s-h3">{f.title}</h3>
              <p className="s-muted">{f.verse}{f.verse && f.preacher ? ' · ' : ''}{f.preacher}</p>
              {f.vid && <a className="s-ytlink" href={ytWatch(f.vid)} target="_blank" rel="noopener">유튜브에서 보기</a>}
            </div>
            {rest.length > 0 && (
              <ul className="s-list">{rest.map((s, i) => (
                <li key={i}>
                  {s.vid ? <a className="s-strong s-link" href={ytWatch(s.vid)} target="_blank" rel="noopener">{s.title}</a> : <span className="s-strong">{s.title}</span>}
                  <span className="s-muted">{md(s.date)} · {s.verse}</span>
                </li>
              ))}</ul>
            )}
          </div>
        </div>
      );
    }
    case 'bulletin': {
      const b = lists.bulletins[0];
      if (!b) return <div className="s-wrap">{title}<p className="s-muted">등록된 주보가 없습니다.</p></div>;
      const pages = pagesOf(b), view = (i: number) => { if (!editable) openBulletin(ed, lists, i); };
      const past = lists.bulletins.slice(1, 6); // earlier bulletins below this week's; the ones that still keep page pictures open in the viewer
      return (
        <div className="s-wrap">{title}
          <div className="s-bulletin">
            {pages[0]
              ? <button type="button" className="s-cover" aria-label={`${b.title} 크게 보기`} onClick={() => view(0)}><img src={pages[0]} alt="" /></button>
              : <div className="s-paper" aria-hidden="true"><span /><span /><span /><span /><span /></div>}
            <div><p className="s-strong">{b.title}</p>{pages.length > 0 && <div className="s-row"><button type="button" className="s-btn" onClick={() => view(0)}>주보 보기</button></div>}</div>
          </div>
          {past.length > 0 && (
            <div className="s-past"><p className="s-past-title">지난 주보</p>
              <ul className="s-list">{past.map((x, k) => (
                <li key={k} className="s-past-row"><span>{x.title}</span>{pagesOf(x).length > 0 && <button type="button" className="s-btn s-btn-line s-btn-sm" onClick={() => view(k + 1)}>보기</button>}</li>
              ))}</ul>
            </div>
          )}
        </div>
      );
    }
    case 'notices': {
      const list = lists.notices.slice(0, +p.count || 3);
      return (
        <div className="s-wrap">{title}
          <ul className="s-list">
            {list.length === 0 && <li className="s-muted">등록된 공지가 없습니다.</li>}
            {list.map((n, i) => n.body ? (
              // a notice with text opens in place (native details); one without text stays a plain row
              <li key={i}><details className="s-notice"><summary><span className="s-strong">{n.title}</span><span className="s-muted">{md(n.date)}</span></summary><div className="s-notice-body"><Br text={n.body} /></div></details></li>
            ) : <li key={i}><span className="s-strong">{n.title}</span><span className="s-muted">{md(n.date)}</span></li>)}
          </ul>
        </div>
      );
    }
    case 'about': {
      const img = safeImg(p.photo);
      return <div className="s-wrap s-split">{img ? <img className="s-photo" src={img} alt="" /> : <div className="s-photo">교회 사진</div>}<div>{title}<p><Br text={p.body} /></p></div></div>;
    }
    case 'staff':
      return (
        <div className="s-wrap">{title}
          {lists.staff.length ? (
            <div className="s-staff">{lists.staff.map((s, i) => (
              <div key={i} className="s-person"><div className="s-avatar" aria-hidden="true">{(s.name || '?')[0]}</div><p className="s-strong">{s.name}</p><p className="s-muted">{s.role}</p></div>
            ))}</div>
          ) : <p className="s-muted">등록된 분이 없습니다.</p>}
        </div>
      );
    case 'pastor': {
      const img = safeImg(p.photo), n = String(p.name || '').trim();
      return (
        <div className="s-wrap s-pastor">
          {img ? <img className="s-pastor-photo" src={img} alt={`${n} ${p.role ?? ''}`} /> : <div className="s-pastor-photo" aria-hidden="true">{n[0] || ''}</div>}
          <div>{title}{p.role && <p className="s-pastor-role">{p.role}</p>}{n && <p className="s-pastor-name">{n}</p>}<p><Br text={p.body} /></p></div>
        </div>
      );
    }
    case 'gallery': {
      const list = lists.gallery.map((g, i): [GalleryItem, number] => [g, i]).filter(([g]) => safeImg(g.image));
      return (
        <div className="s-wrap">{title}
          {list.length ? (
            <div className="s-gallery">{list.map(([g, i]) => (
              <figure key={i}>
                <button type="button" className="s-gal" aria-label={`${i + 1}번째 사진 크게 보기`} onClick={() => { if (!editable) ed.openViewer('갤러리', <img src={safeImg(g.image)} alt="갤러리 사진" />); }}>
                  <img src={safeImg(g.image)} alt="" loading="lazy" />
                </button>
                {doc.design === 'navy' && g.title && <figcaption>{g.title}</figcaption>}
              </figure>
            ))}</div>
          ) : <p className="s-muted">등록된 사진이 없습니다.</p>}
        </div>
      );
    }
    case 'map': return <MapBlock title={title} doc={doc} editable={editable} />;
    case 'text': return <div className="s-wrap">{title}<p><Br text={p.body} /></p></div>;
    case 'form':
      return (
        <div className="s-wrap">{title}<p><Br text={p.body} /></p>
          <div className="s-form">
            <label>이름<input type="text" disabled placeholder="홍길동" /></label><label>연락처<input type="text" disabled placeholder="010-0000-0000" /></label>
            <div className="s-consent">
              <p className="s-strong">개인정보 수집·이용 동의 (필수)</p><p>수집 항목: 이름, 연락처 · 목적: 새가족 연락 · 보유 기간: 1년 후 자동 파기 · 동의하지 않을 수 있으나, 이 경우 등록할 수 없습니다.</p>
              <label className="s-check"><input type="checkbox" disabled /> 위 내용에 동의합니다</label>
              <p className="s-strong">신앙 관련 정보 별도 동의 (필수)</p><p>교회 등록 의사는 신앙을 드러내는 정보라 따로 동의를 받습니다.</p>
              <label className="s-check"><input type="checkbox" disabled /> 별도로 동의합니다</label>
              <label className="s-check"><input type="checkbox" disabled /> 만 14세 미만입니다 (보호자 동의 필요)</label>
            </div>
            <span className="s-btn">등록하기</span>
          </div>
          <p className="s-note">미리보기에서는 제출되지 않습니다.</p>
        </div>
      );
  }
}

function openBulletin(ed: ReturnType<typeof useEd>, lists: Lists, i: number) {
  const b = lists.bulletins[i], pages = pagesOf(b);
  if (!b || !pages.length) { ed.toast('이 주보는 미리보기가 없어요. 파일을 다시 올려 주세요.'); return; }
  ed.openViewer(b.title, <>
    {pages.map((src, k) => <img key={k} src={src} alt={`${b.title} ${k + 1}쪽`} />)}
    {(b.pageCount ?? 0) > pages.length && <p className="viewer-more">미리보기는 앞 {pages.length}쪽까지예요. 전체 {b.pageCount}쪽</p>}
  </>);
}

function MapBlock({ title, doc, editable }: { title: ReactNode; doc: Doc; editable: boolean }) {
  const ed = useEd(), addrRef = useRef<HTMLParagraphElement>(null);
  const pl = placeOf(doc), L = mapLinks(pl.addr);
  const row = (k: 'transit' | 'parking' | 'phone', label: string) => String(pl[k] || '').trim() ? <><dt>{label}</dt><dd>{pl[k]}</dd></> : null;
  const copy = () => { // copy the address on the live site; where the clipboard is refused, select it instead
    if (editable) return;
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(addrRef.current!);
      const s = getSelection()!; s.removeAllRanges(); s.addRange(r);
      ed.toast('주소를 선택했어요. 복사해서 쓰세요.');
    };
    try { navigator.clipboard.writeText(pl.addr).then(() => ed.toast('주소를 복사했어요.'), fallback); } catch { fallback(); }
  };
  const info = [row('transit', '대중교통'), row('parking', '주차'), row('phone', '전화')].some(Boolean);
  return (
    <div className="s-wrap">{title}
      {String(pl.addr || '').trim() && (
        <div className="s-placecard">
          <div className="s-place-head">
            <div><p className="s-place-name">{nameOf(doc)}</p><p className="s-place-addr" ref={addrRef}>{pl.addr}</p></div>
            <button type="button" className="s-copy" onClick={copy}><CopyIcon />복사</button>
          </div>
          <div className="s-place-apps">{APPS.map(([k, label]) => (
            <a key={k} className="s-place-app" href={L[k]} {...(k === 'tmap' ? {} : { target: '_blank', rel: 'noopener' })}><span className="s-place-ico">{APP_ICONS[k]}</span><span>{label}</span></a>
          ))}</div>
        </div>
      )}
      {info && <dl className="s-dl s-mapinfo">{row('transit', '대중교통')}{row('parking', '주차')}{row('phone', '전화')}</dl>}
    </div>
  );
}

export interface SiteProps {
  doc: Doc; lists: Lists; device: Device; editable: boolean;
  /** editor chrome around one block (selection, tools, drag) */
  wrapBlock?: (b: Block, index: number, body: ReactNode) => ReactNode;
  /** rendered after the last block (drop line) */
  tail?: ReactNode;
  blocksRef?: Ref<HTMLDivElement>;
}

export function Site({ doc, lists, device, editable, wrapBlock, tail, blocksRef }: SiteProps) {
  const ed = useEd();
  const blocks = doc.blocks.filter(b => editable || !b.hidden);
  const tabs = TABS.filter(([t]) => blocks.some(b => b.type === t)).slice(0, 4);
  const openDoc = (kind: DocKind) => ed.openViewer(DOC_TITLE[kind], <LegalDoc kind={kind} doc={doc} />);
  return (
    <div className={`site${doc.design ? ` d-over d-${doc.design}` : ''}${device === 'mobile' ? ' is-mobile' : ''}${!editable && device === 'pc' ? ' is-wide' : ''}`} style={{ '--s-accent': accentOf(doc) } as CSSProperties}>
      <div className="s-nav">
        <strong className="s-brand"><Logo doc={doc} />{nameOf(doc)}</strong>
        {/* the warm design lays a menu over the hero; it is built from the blocks, so there is nothing extra to maintain */}
        {doc.design && (
          <nav className="s-menu" aria-label="사이트 메뉴">
            {blocks.filter(b => b.type !== 'hero').slice(0, 6).map(b => <a key={b.id} href={`#sec-${b.type}`} onClick={e => { if (editable) e.preventDefault(); }}>{TYPES[b.type].name}</a>)}
          </nav>
        )}
      </div>
      <div className="blocks" id="blocks" ref={blocksRef}>
        {blocks.map((b, i) => {
          const bg = 'bg-' + (b.props.bg || 'white'), body = <BlockBody type={b.type} p={b.props} doc={doc} lists={lists} editable={editable} />;
          // one block per type, so the section id is unique
          return wrapBlock ? wrapBlock(b, i, <div className="s-inner">{body}</div>) : <section key={b.id} className={`s-sec t-${b.type} ${bg}`} id={`sec-${b.type}`}>{body}</section>;
        })}
        {blocks.length === 0 && <div className="empty">왼쪽에서 블록을 끌어다 놓으세요</div>}
        {tail}
      </div>
      <footer className="s-foot">
        {editable && <div className="blk-tag on">꼬리말 · 개인정보처리방침 링크는 항상 표시되며 지울 수 없어요</div>}
        <p className="s-strong">{nameOf(doc)}</p><p>{placeOf(doc).addr} · {placeOf(doc).phone}</p>
        <p className="s-links"><button type="button" onClick={() => openDoc('privacy')}>개인정보처리방침</button><button type="button" onClick={() => openDoc('terms')}>이용약관</button><span>신고하기</span></p>
      </footer>
      {/* shown on phone width only (css); sticks to the bottom of the window like a native tab bar */}
      {tabs.length > 0 && (
        <nav className="s-tabbar" aria-label="바로가기">{tabs.map(([t, label]) => (
          <a key={t} href={`#sec-${t}`} onClick={e => { if (editable) e.preventDefault(); }}>{TAB_ICONS[t]}<span>{label}</span></a>
        ))}</nav>
      )}
    </div>
  );
}

export { TYPES };
