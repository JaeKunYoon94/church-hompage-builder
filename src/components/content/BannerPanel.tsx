import { useEffect, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BTN_TO, DEFAULT_BANNER } from '@/constants';
import { accentOf, nameOf, safeImg, shrink } from '@/lib/util';
import { cn } from '@/lib/utils';
import { useEd } from '@/store';
import type { Banner } from '@/types';
import { FilePick } from '../FilePick';
import { Hero } from '../Site';

type Form = Omit<Banner, 'image'>;
const pick = (b: Banner): Form => { const { image: _image, ...f } = { ...DEFAULT_BANNER, ...b }; return f; };
const IMG_TYPES = /^image\/(jpeg|png|webp)$/;

/**
 * The form is a draft of the picked banner: the preview follows every keystroke, the site changes only on 저장.
 * `image` is undefined until a photo is picked, so an untouched banner keeps its saved photo.
 */
export function BannerPanel({ active }: { active: boolean }) {
  const ed = useEd(), banners = ed.data.banners, accent = accentOf(ed.data.draft);
  const [idx, setIdx] = useState(0);
  const cur = banners[Math.min(idx, banners.length - 1)];
  const [form, setForm] = useState<Form>(() => pick(cur));
  const [image, setImage] = useState<string | undefined>(undefined);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const shownImage = image !== undefined ? image : (cur.image || '');

  const fill = (i: number) => { const k = Math.min(Math.max(0, i), banners.length - 1); setIdx(k); setForm(pick(banners[k])); setImage(undefined); setErr(''); };
  // entering the tab starts from the saved banner (as opening the menu did before)
  useEffect(() => { if (active) fill(idx); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [active]);

  const saved = { ...pick(cur), image: cur.image || '' };
  const changed = (Object.keys(form) as (keyof Form)[]).some(k => (form[k] || '') !== (saved[k] || '')) || (image !== undefined && image !== saved.image);
  const guard = () => { if (changed) { ed.toast('저장하지 않은 변경이 있어요. 먼저 저장하거나 ‘바꾼 내용 취소’를 눌러 주세요.'); return false; } return true; };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  const usePhoto = (file: File) => {
    setErr('');
    if (!IMG_TYPES.test(file.type)) return setErr('JPG, PNG, WEBP 사진만 올릴 수 있어요.');
    if (file.size > 20 * 1024 * 1024) return setErr('20MB 이하 사진만 올릴 수 있어요.');
    shrink(file).then(setImage).catch(() => setErr('사진을 읽지 못했어요. 다른 사진으로 다시 해 주세요.'));
  };

  const save = () => { // title is optional: a photo-only banner is fine
    const next: Banner = { ...form, image: shownImage };
    ed.setList('banners', a => a.map((b, i) => i === idx ? next : b));
    setImage(undefined);
    ed.toast('대표 배너를 저장했어요. 홈페이지에 바로 반영됐습니다.');
  };
  const move = (d: number) => {
    const j = idx + d; if (j < 0 || j >= banners.length) return;
    ed.setList('banners', a => { const n = [...a]; [n[idx], n[j]] = [n[j], n[idx]]; return n; });
    setIdx(j);
  };
  const add = () => {
    if (!guard()) return;
    ed.setList('banners', a => [...a, { ...DEFAULT_BANNER, title: '', sub: '', btn: '', btnTo: '', btn2: '', btn2To: '', image: '' }]);
    setIdx(banners.length); setForm(pick({ ...DEFAULT_BANNER, title: '', sub: '', btn: '', btnTo: '', btn2: '', btn2To: '', image: '' })); setImage(undefined);
    ed.toast('새 배너를 추가했어요. 내용을 넣고 저장하세요.');
  };
  const remove = () => {
    if (banners.length < 2) return;
    const i = idx, gone = banners[i], k = Math.max(0, i - 1);
    ed.setList('banners', a => a.filter((_, n) => n !== i));
    setIdx(k); setForm(pick(banners[k === i ? 1 : k])); setImage(undefined);
    ed.toast('배너를 삭제했어요.', '되돌리기', () => { ed.setList('banners', a => { const n = [...a]; n.splice(i, 0, gone); return n; }); setIdx(i); setForm(pick(gone)); });
  };

  const preview: Banner = { ...form, image: shownImage };
  const count = (v: string, max: number) => <p className="text-right text-sm text-muted-foreground tabular-nums">{v.length} / {max}자</p>;
  return (
    <Card>
      <CardHeader className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <CardTitle className="text-lg">대표 배너</CardTitle>
        <span className="text-sm text-muted-foreground">홈페이지에 들어오면 가장 먼저 보이는 영역이에요. 2개 이상이면 6초마다 넘어가요.</span>
      </CardHeader>
      <CardContent>
        <div className="mb-2.5 flex flex-wrap gap-2" aria-label="배너 목록">
          {banners.map((b, i) => (
            <button key={i} type="button" aria-pressed={i === idx} onClick={() => { if (i !== idx && guard()) fill(i); }}
              className={cn('inline-flex min-h-11 max-w-60 items-center gap-2 rounded-lg border bg-card py-1.5 pr-3 pl-1.5 text-sm', i === idx && 'border-primary bg-accent font-semibold')}>
              {safeImg(b.image) ? <img src={b.image} alt="" className="h-7 w-11 shrink-0 rounded-md object-cover" /> : <span className="h-7 w-11 shrink-0 rounded-md" style={{ background: accent }} />}
              <span className="truncate">{i + 1}. {b.title || '제목 없음'}</span>
            </button>
          ))}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={idx === 0} onClick={() => move(-1)}>← 앞으로</Button>
          <Button variant="outline" disabled={idx === banners.length - 1} onClick={() => move(1)}>뒤로 →</Button>
          <Button variant="outline" disabled={banners.length < 2} onClick={remove}>이 배너 삭제</Button>
          <Button variant="outline" onClick={add}>+ 배너 추가</Button>
        </div>
        <div className="mb-5 rounded-2xl bg-canvas p-3" aria-label="고른 배너 미리보기">
          <div className="site pointer-events-none !shadow-none" style={{ '--s-accent': accent } as CSSProperties}><Hero banner={preview} name={nameOf(ed.data.draft)} /></div>
        </div>
        <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); save(); }}>
          <div className="grid gap-1.5"><Label htmlFor="bn-title">제목</Label><Input id="bn-title" maxLength={40} autoComplete="off" value={form.title} onChange={e => set('title', e.target.value)} />{count(form.title, 40)}</div>
          <div className="grid gap-1.5"><Label htmlFor="bn-sub">부제</Label><Input id="bn-sub" maxLength={60} autoComplete="off" placeholder="비워 두면 나오지 않아요" value={form.sub} onChange={e => set('sub', e.target.value)} />{count(form.sub, 60)}</div>
          <div className="grid gap-x-4 gap-y-3.5 min-[561px]:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="bn-btn">버튼 문구</Label><Input id="bn-btn" maxLength={16} autoComplete="off" placeholder="비워 두면 버튼이 없어요" value={form.btn} onChange={e => set('btn', e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="bn-to">버튼을 누르면</Label>
              <Select value={form.btnTo || 'none'} onValueChange={v => set('btnTo', v === 'none' ? '' : v)}>
                <SelectTrigger id="bn-to" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(BTN_TO).map(([k, label]) => <SelectItem key={k || 'none'} value={k || 'none'}>{label}{k && !ed.data.draft.blocks.some(b => b.type === k) ? ' (페이지에 없음)' : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-x-4 gap-y-3.5 min-[561px]:grid-cols-2">
            <div className="grid gap-1.5"><Label htmlFor="bn-btn2">두 번째 버튼 문구</Label><Input id="bn-btn2" maxLength={16} autoComplete="off" placeholder="비워 두면 없어요 (예: 새가족 안내)" value={form.btn2} onChange={e => set('btn2', e.target.value)} /></div>
            <div className="grid gap-1.5"><Label htmlFor="bn-to2">두 번째 버튼을 누르면</Label>
              <Select value={form.btn2To || 'none'} onValueChange={v => set('btn2To', v === 'none' ? '' : v)}>
                <SelectTrigger id="bn-to2" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(BTN_TO).map(([k, label]) => <SelectItem key={k || 'none'} value={k || 'none'}>{label}{k && !ed.data.draft.blocks.some(b => b.type === k) ? ' (페이지에 없음)' : ''}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <span className="text-sm leading-none font-semibold">배경 사진</span>
            <div className={cn('grid min-h-40 place-items-center gap-3 rounded-2xl border-2 border-dashed border-muted-foreground bg-canvas p-5 text-center transition-colors', over && 'border-ring bg-accent')}
              onDragOver={e => { if (!Array.from(e.dataTransfer.types).includes('Files')) return; e.preventDefault(); setOver(true); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
              onDrop={e => { if (!Array.from(e.dataTransfer.types).includes('Files')) return; e.preventDefault(); setOver(false); if (e.dataTransfer.files[0]) usePhoto(e.dataTransfer.files[0]); }}>
              {safeImg(shownImage) && <img src={safeImg(shownImage)} alt="고른 배경 사진" className="max-h-[220px] w-full rounded-xl object-cover" />}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!safeImg(shownImage) && <strong className="basis-full font-semibold">사진을 여기로 끌어다 놓거나</strong>}
                <FilePick accept="image/jpeg,image/png,image/webp" onFiles={([f]) => usePhoto(f)}>{safeImg(shownImage) ? '다른 사진으로 바꾸기' : '사진 고르기'}</FilePick>
                {safeImg(shownImage) && <Button type="button" variant="outline" onClick={() => setImage('')}>사진 빼기</Button>}
              </div>
            </div>
            {err && <p role="alert" className="rounded-lg border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-[15px]">{err}</p>}
            <p className="text-sm text-muted-foreground">JPG·PNG·WEBP, 20MB 이하. 가로로 긴 사진이 잘 어울려요. 사진이 없으면 대표 색상으로 채워져요.</p>
          </div>
          <div className="grid gap-x-4 gap-y-3.5 min-[561px]:grid-cols-2">
            <div className="grid gap-1.5"><span className="text-sm leading-none font-semibold">글자 위치</span>
              <RadioGroup className="flex flex-wrap gap-2" value={form.align} onValueChange={v => set('align', v as Form['align'])}>
                {([['left', '왼쪽'], ['center', '가운데']] as const).map(([v, l]) => <Label key={v} htmlFor={`bn-al-${v}`} className={cn('h-11 cursor-pointer gap-2 rounded-lg border px-2.5 font-normal', form.align === v && 'border-primary bg-accent')}><RadioGroupItem id={`bn-al-${v}`} value={v} />{l}</Label>)}
              </RadioGroup></div>
            <div className="grid gap-1.5"><span className="text-sm leading-none font-semibold">사진 어둡게</span>
              <RadioGroup className="flex flex-wrap gap-2" value={form.dim} onValueChange={v => set('dim', v as Form['dim'])}>
                {([['low', '약하게'], ['mid', '보통'], ['high', '진하게']] as const).map(([v, l]) => <Label key={v} htmlFor={`bn-dim-${v}`} className={cn('h-11 cursor-pointer gap-2 rounded-lg border px-2.5 font-normal', form.dim === v && 'border-primary bg-accent')}><RadioGroupItem id={`bn-dim-${v}`} value={v} />{l}</Label>)}
              </RadioGroup></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit">저장하고 홈페이지에 반영</Button>
            <Button type="button" variant="outline" disabled={!changed} onClick={() => fill(idx)}>바꾼 내용 취소</Button>
            {changed && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2.5 rounded-full bg-ring" />저장하지 않은 변경이 있어요</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
