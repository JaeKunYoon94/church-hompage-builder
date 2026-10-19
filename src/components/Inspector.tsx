import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BG, COLORS, CTAB, LABEL, TYPES, WORSHIP } from '@/constants';
import { accentOf, clone, contrastOnWhite, nameOf, placeOf, privacyOf, safeImg, shrink, worshipOf } from '@/lib/util';
import { cn } from '@/lib/utils';
import { useEd } from '@/store';
import type { Block, DocKind } from '@/types';
import { FilePick } from './FilePick';
import { Logo } from './icons';
import { DOC_TITLE, LegalDoc } from './Legal';

const IMG_TYPES = /^image\/(jpeg|png|webp)$/;
const Field = ({ label, htmlFor, children, hint }: { label: ReactNode; htmlFor?: string; children: ReactNode; hint?: ReactNode }) => (
  <div className="mb-3.5 grid gap-1.5">
    {htmlFor ? <Label htmlFor={htmlFor}>{label}</Label> : <span className="text-sm leading-none font-semibold">{label}</span>}
    {children}
    {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
  </div>
);
const ErrorNote = ({ children }: { children: ReactNode }) => <p role="alert" className="rounded-lg border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-[15px]">{children}</p>;
const Note = ({ children, muted }: { children: ReactNode; muted?: boolean }) => <p className={cn('mb-3.5 rounded-xl p-3 text-sm', muted ? 'bg-muted' : 'bg-accent')}>{children}</p>;

/** right pane: site settings when nothing is selected, otherwise the selected block's fields */
export function Inspector() {
  const ed = useEd(), sel = ed.data.draft.blocks.find(b => b.id === ed.ui.sel);
  return (
    // key: remount on selection change and after undo/redo, so every field re-reads the draft
    <aside key={`${ed.rev}-${sel?.id ?? 'site'}`} aria-label="블록 설정" onBlur={ed.endTyping}
      className="rounded-xl border bg-card p-4 min-[1101px]:sticky min-[1101px]:top-[76px] min-[1101px]:max-h-[calc(100vh-96px)] min-[1101px]:overflow-auto min-[721px]:max-[1100px]:col-span-full">
      {sel ? <BlockForm block={sel} /> : <SiteSettings />}
    </aside>
  );
}

function PhotoUpload({ maxMb, size, type, onDone, label, again, onRemove, removeLabel, hint }: {
  maxMb: number; size: number; type?: string; onDone: (url: string) => void; label: string; again: string; onRemove?: () => void; removeLabel: string; hint: string;
}) {
  const [err, setErr] = useState('');
  const has = !!onRemove;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <FilePick accept="image/png,image/jpeg,image/webp" onFiles={([file]) => {
          setErr('');
          if (!IMG_TYPES.test(file.type)) return setErr('JPG, PNG, WEBP 이미지만 올릴 수 있어요.');
          if (file.size > maxMb * 1024 * 1024) return setErr(`${maxMb}MB 이하 이미지만 올릴 수 있어요.`);
          shrink(file, size, type).then(onDone).catch(() => setErr('이미지를 읽지 못했어요. 다른 파일로 다시 해 주세요.'));
        }}>{has ? again : label}</FilePick>
        {onRemove && <Button variant="outline" onClick={onRemove}>{removeLabel}</Button>}
      </div>
      {err && <ErrorNote>{err}</ErrorNote>}
      <p className="text-sm text-muted-foreground">{hint}</p>
    </>
  );
}

function SiteSettings() {
  const ed = useEd(), draft = ed.data.draft;
  const hero = draft.blocks.find(b => b.type === 'hero'), hasLogo = !!safeImg(draft.logo), accent = accentOf(draft), custom = !COLORS[draft.color ?? ''];
  const [name, setName] = useState(nameOf(draft));
  const pv = privacyOf(draft);
  const setPv = (k: 'officer' | 'contact' | 'effective', v: string) => ed.edit(d => { d.privacy = { ...privacyOf(d), [k]: v }; }, true);
  const openDoc = (k: DocKind) => ed.openViewer(DOC_TITLE[k], <LegalDoc kind={k} doc={draft} />);
  return (
    <>
      <div className="mb-3"><p className="text-xs text-muted-foreground">사이트 설정</p><h2 className="text-xl font-semibold">교회 정보</h2></div>
      <Field label="교회 이름" htmlFor="s-name" hint="메뉴, 대표 배너, 꼬리말의 이름이 함께 바뀌어요.">
        <Input id="s-name" maxLength={30} autoComplete="off" value={name} aria-invalid={!name.trim()}
          onChange={e => { setName(e.target.value); const v = e.target.value.trim(); if (v) ed.edit(d => { d.name = v; }, true); }} />
        {!name.trim() && <ErrorNote>교회 이름을 입력해 주세요.</ErrorNote>}
      </Field>
      <Field label="교회 아이콘">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border bg-white" style={{ '--s-accent': accent } as React.CSSProperties}><Logo doc={draft} /></span>
          <span className="text-sm text-muted-foreground">{hasLogo ? '직접 올린 아이콘' : '기본 교회 아이콘'} · 메뉴의 교회 이름 옆에 표시돼요</span>
        </div>
        <PhotoUpload maxMb={5} size={256} type="image/png" label="아이콘 올리기" again="다른 아이콘으로 바꾸기" removeLabel="기본 아이콘으로" hint="정사각형 PNG를 권장해요. 5MB 이하."
          onRemove={hasLogo ? () => { ed.edit(d => { d.logo = ''; }); ed.toast('기본 교회 아이콘으로 바꿨어요.', '실행 취소', ed.undo); } : undefined}
          onDone={url => { ed.edit(d => { d.logo = url; }); ed.toast('교회 아이콘을 바꿨어요. 발행하면 방문자에게 보여요.'); }} />
      </Field>
      <Note>배너 사진과 문구는 ‘콘텐츠 관리 › 대표 배너’에서 바꿔요.{hero ? '' : ' 지금은 페이지에 대표 배너 블록이 없어요.'}</Note>
      <div className="mb-3.5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { ed.patchUi({ view: 'content', ctab: 'banner' }); window.scrollTo({ top: 0 }); }}>대표 배너 관리로 가기</Button>
        {!hero && <Button variant="outline" onClick={() => ed.addBlock('hero', 0)}>대표 배너 블록 추가</Button>}
      </div>
      <Field label="대표 색상" hint="고른 색이 배너, 버튼, 연한 배경 구역에 함께 쓰여요.">
        <RadioGroup className="flex flex-wrap gap-2" value={custom ? '' : draft.color} onValueChange={v => ed.edit(d => { d.color = v; })}>
          {Object.entries(COLORS).map(([k, c]) => (
            <Label key={k} htmlFor={`c-${k}`} className={cn('h-11 cursor-pointer gap-2 rounded-lg border px-2.5 font-normal', draft.color === k && 'border-primary bg-accent')}>
              <RadioGroupItem id={`c-${k}`} value={k} /><span className="size-4 rounded-full" style={{ background: c.v }} />{c.name}
            </Label>
          ))}
          <Label htmlFor="c-pick" className={cn('h-11 cursor-pointer gap-2 rounded-lg border px-2.5 font-normal', custom && 'border-primary bg-accent')}>
            <input type="color" id="c-pick" className="size-6 cursor-pointer rounded-full border-0 bg-transparent p-0" value={accent} onChange={e => { const v = e.target.value.toLowerCase(); ed.edit(d => { d.color = v; }, true); }} />직접 고르기
          </Label>
        </RadioGroup>
        {contrastOnWhite(accent) < 4.5 && <ErrorNote>이 색은 흰 글씨가 잘 안 보일 수 있어요. 조금 더 진한 색을 권해요.</ErrorNote>}
      </Field>
      <Field label="개인정보 보호책임자" hint="교회 이름과 이 정보로 개인정보처리방침과 이용약관이 자동으로 만들어져 꼬리말에 연결돼요. 기본 문안이라 실제로 쓰기 전에 법률 검토를 받으세요.">
        <Input value={pv.officer} onChange={e => setPv('officer', e.target.value)} placeholder="이름과 직분 (예: 이○○ 부목사)" aria-label="개인정보 보호책임자 이름과 직분" autoComplete="off" />
        <Input value={pv.contact} onChange={e => setPv('contact', e.target.value)} placeholder="전화번호 또는 이메일" aria-label="개인정보 보호책임자 연락처" autoComplete="off" />
        <Label htmlFor="pv-effective" className="mt-1 text-sm font-normal text-muted-foreground">시행일</Label>
        <Input id="pv-effective" type="date" value={pv.effective} onChange={e => setPv('effective', e.target.value)} />
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openDoc('privacy')}>개인정보처리방침 보기</Button><Button variant="outline" onClick={() => openDoc('terms')}>이용약관 보기</Button></div>
      </Field>
      <ul className="grid list-disc gap-1.5 pl-[18px] text-sm text-muted-foreground">
        <li>블록을 누르면 여기서 문구를 고칠 수 있어요.</li><li>블록을 끌거나 ↑ ↓ 버튼으로 순서를 바꿔요.</li>
        <li>바꾼 내용은 ‘발행하기’를 눌러야 방문자에게 보여요.</li><li>설교·공지는 ‘콘텐츠 관리’에 올리면 바로 반영돼요.</li>
      </ul>
    </>
  );
}

function BlockForm({ block: b }: { block: Block }) {
  const ed = useEd(), t = TYPES[b.type], draft = ed.data.draft;
  const setProp = (k: string, v: string, typing = true) => ed.edit(d => { const x = d.blocks.find(y => y.id === b.id); if (x) x.props[k] = v; }, typing);
  const tab = CTAB[t.auto];
  const rows = worshipOf(draft);
  const setCell = (i: number, c: number, v: string) => ed.edit(d => {
    if (!Array.isArray(d.worship)) d.worship = clone(WORSHIP);
    if (d.worship[i]) d.worship[i][c] = v;
  }, true);
  const rowPlaceholder = ['예배 이름 (예: 주일 1부 예배)', '시간', '장소'];

  return (
    <>
      <div className="mb-3">
        <p className="text-xs text-muted-foreground">선택한 블록</p><h2 className="mb-2 text-xl font-semibold">{t.name}</h2>
        <p className={cn('inline-block rounded-md px-2.5 py-0.5 text-[13px]', t.auto ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{t.auto ? `자동형 · ‘${t.auto}’에서 불러옴` : '직접 입력형'}</p>
      </div>
      {Object.keys(t.props).filter(k => k !== 'photo').map(k => { // only the type's current fields; old saves may carry retired ones
        const v = b.props[k] ?? t.props[k], id = 'f-' + k;
        if (k === 'bg') return (
          <Field key={k} label={LABEL.bg}>
            <RadioGroup className="flex flex-wrap gap-2" value={v} onValueChange={x => setProp('bg', x, false)}>
              {Object.entries(BG).map(([o, name]) => (
                <Label key={o} htmlFor={`bg-${o}`} className={cn('h-11 cursor-pointer gap-2 rounded-lg border px-2.5 font-normal', v === o && 'border-primary bg-accent')}><RadioGroupItem id={`bg-${o}`} value={o} />{name}</Label>
              ))}
            </RadioGroup>
          </Field>
        );
        if (k === 'count') return (
          <Field key={k} label={LABEL.count} htmlFor={id}>
            <Select value={String(+v || 3)} onValueChange={x => setProp('count', x, false)}>
              <SelectTrigger id={id} className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}개</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        );
        if (k === 'body') return <Field key={k} label={LABEL.body} htmlFor={id}><Textarea id={id} className="min-h-[110px] text-base" value={v} onChange={e => setProp('body', e.target.value)} /></Field>;
        return <Field key={k} label={LABEL[k] || k} htmlFor={id}><Input id={id} value={v} onChange={e => setProp(k, e.target.value)} /></Field>;
      })}

      {tab ? (
        <>
          <Note>이 블록의 내용은 ‘콘텐츠 관리 › {t.auto}’에 올리면 자동으로 바뀝니다. 발행하지 않아도 돼요.</Note>
          <div className="mb-3.5"><Button variant="outline" onClick={() => { ed.patchUi({ view: 'content', ctab: tab }); window.scrollTo({ top: 0 }); }}>{t.auto} 관리로 가기</Button></div>
        </>
      ) : b.type === 'worship' ? (
        <Field label="예배 시간표" hint="빈 줄은 홈페이지에 나오지 않아요. 바꾼 시간표는 발행하면 방문자에게 보여요.">
          <div className="mb-1 grid gap-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-1.5 rounded-xl border p-2">
                <Input className="col-span-full" id={`ws-${i}-0`} value={r[0]} placeholder={rowPlaceholder[0]} aria-label={`${i + 1}번째 예배 이름`} onChange={e => setCell(i, 0, e.target.value)} />
                <Input value={r[1]} placeholder={rowPlaceholder[1]} aria-label={`${i + 1}번째 예배 시간`} onChange={e => setCell(i, 1, e.target.value)} />
                <Input value={r[2]} placeholder={rowPlaceholder[2]} aria-label={`${i + 1}번째 예배 장소`} onChange={e => setCell(i, 2, e.target.value)} />
                <Button variant="outline" size="sm" className="col-span-full justify-self-end" aria-label={`${i + 1}번째 예배 삭제`}
                  onClick={() => { ed.edit(d => { if (!Array.isArray(d.worship)) d.worship = clone(WORSHIP); d.worship.splice(i, 1); }); ed.toast('예배를 시간표에서 뺐어요.', '실행 취소', ed.undo); }}>삭제</Button>
              </div>
            ))}
          </div>
          <div><Button variant="outline" onClick={() => { ed.edit(d => { if (!Array.isArray(d.worship)) d.worship = clone(WORSHIP); d.worship.push(['', '', '']); }); setTimeout(() => document.getElementById(`ws-${rows.length}-0`)?.focus(), 0); }}>예배 추가</Button></div>
        </Field>
      ) : b.type === 'map' ? (
        <Field label="주차 안내" htmlFor="pl-parking" hint="오시는 길 블록에서는 주차 안내만 고칠 수 있어요.">
          <Input id="pl-parking" autoComplete="off" value={placeOf(draft).parking} placeholder="예: 교회 앞 20대, 주일에는 옆 학교 운동장 이용"
            onChange={e => { const v = e.target.value; ed.edit(d => { d.place = { ...placeOf(d), parking: v }; }, true); }} />
        </Field>
      ) : b.type === 'pastor' || b.type === 'about' ? (
        <Field label="사진">
          <PhotoUpload maxMb={20} size={700} label="사진 올리기" again="다른 사진으로 바꾸기" removeLabel="사진 지우기" hint={b.type === 'about' ? 'JPG·PNG·WEBP, 20MB 이하. 없으면 ‘교회 사진’ 자리표시가 보여요.' : '세로로 긴 사진이 잘 어울려요. JPG·PNG·WEBP, 20MB 이하. 없으면 이름 첫 글자가 보여요.'}
            onRemove={safeImg(b.props.photo) ? () => { setProp('photo', '', false); ed.toast('사진을 지웠어요.', '실행 취소', ed.undo); } : undefined}
            onDone={url => { setProp('photo', url, false); ed.toast('사진을 바꿨어요. 발행하면 방문자에게 보여요.'); }} />
        </Field>
      ) : t.auto ? (
        <Note>이 블록의 내용은 ‘{t.auto}’에서 불러옵니다. 시안에서는 예시 내용이 고정되어 있어요.</Note>
      ) : null}
      {b.type === 'form' && <Note muted>개인정보 수집 동의, 신앙 관련 정보 별도 동의, 만 14세 미만 확인은 자동으로 붙고 뺄 수 없어요.</Note>}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => ed.blockAct('hide', b.id)}>{b.hidden ? '보이기' : '숨기기'}</Button>
        <Button variant="outline" onClick={() => ed.blockAct('del', b.id)}>삭제</Button>
        <Button variant="outline" onClick={() => ed.patchUi({ sel: null })}>선택 해제</Button>
      </div>
    </>
  );
}
