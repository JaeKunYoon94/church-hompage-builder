import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GALLERY_MAX } from '@/constants';
import { moveItem, removeItem } from '@/lib/lists';
import { bulletinPages } from '@/lib/pdf';
import { md, pagesOf, safeImg, shrink, today } from '@/lib/util';
import { useEd } from '@/store';
import type { Bulletin } from '@/types';
import { FormError, Hint, ItemList, ListTitle, Meta, Panel, Row } from './parts';

export function BulletinsPanel() {
  const ed = useEd(), list = ed.data.bulletins;
  const [date, setDate] = useState(today), [title, setTitle] = useState(''), [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0), [err, setErr] = useState(''), [busy, setBusy] = useState(false);

  const submit = async () => {
    const bad = file && !/^(application\/pdf|image\/(jpeg|png))$/.test(file.type) ? 'PDF, JPG, PNG 파일만 올릴 수 있어요.' : file && file.size > 20 * 1024 * 1024 ? '20MB 이하 파일만 올릴 수 있어요.' : '';
    setErr(bad);
    if (bad) return;
    setBusy(true);
    let made: Pick<Bulletin, 'pages' | 'pageCount'> = { pages: [], pageCount: 0 }, note = '';
    try { if (file) made = await bulletinPages(file); } catch { note = ' 미리보기는 만들지 못했어요. 인터넷 연결을 확인하고 다시 올려 주세요.'; }
    setBusy(false);
    const d = date || today;
    ed.setList('bulletins', a => {
      const n = [{ title: title.trim() || `${md(d)} 주보`, date: d, file: file ? file.name : '', ...made }, ...a].sort((x, y) => (y.date || '').localeCompare(x.date || ''));
      n.forEach((b, i) => { if (i > 3) delete b.pages; }); // ponytail: only the four newest keep pictures so browser storage does not overflow; the real service keeps every file on the server
      return n;
    });
    setTitle(''); setFile(null); setFileKey(k => k + 1); setDate(today);
    ed.toast('주보를 올렸어요. 홈페이지의 ‘주보’에 바로 반영됐습니다.' + note);
  };
  const preview = (i: number) => {
    const b = list[i], pages = pagesOf(b);
    if (!pages.length) { ed.toast('이 주보는 미리보기가 없어요. 파일을 다시 올려 주세요.'); return; }
    ed.openViewer(b.title, <>{pages.map((src, k) => <img key={k} src={src} alt={`${b.title} ${k + 1}쪽`} />)}{(b.pageCount ?? 0) > pages.length && <p className="text-sm text-muted-foreground">미리보기는 앞 {pages.length}쪽까지예요. 전체 {b.pageCount}쪽</p>}</>);
  };

  return (
    <Panel title="주보 올리기">
      <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); void submit(); }}>
        <div className="grid gap-1.5"><Label htmlFor="bl-date">날짜</Label><Input id="bl-date" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="bl-title">제목</Label><Input id="bl-title" autoComplete="off" placeholder="비워 두면 ‘2026년 10월 18일 주보’처럼 붙어요" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="bl-file">파일 (PDF 또는 사진)</Label>
          <Input key={fileKey} id="bl-file" type="file" accept="application/pdf,image/jpeg,image/png" className="pt-2" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Hint>PDF는 앞 4쪽을 미리보기 그림으로 만들어 홈페이지에서 바로 넘겨 볼 수 있어요. 사진은 그대로 보여요. 최근 주보 4개까지 홈페이지에서 열어 볼 수 있고, 나머지는 ‘지난 주보’ 목록에 제목만 나와요.</Hint>
        </div>
        {err && <FormError>{err}</FormError>}
        <div><Button type="submit" disabled={busy}>{busy ? (file ? '미리보기 만드는 중…' : '저장 중…') : '저장'}</Button></div>
      </form>
      <ListTitle>올린 주보</ListTitle>
      <ItemList>{list.map((b, i) => (
        <Row key={i} actions={<>
          {pagesOf(b).length > 0 && <Button variant="outline" size="sm" onClick={() => preview(i)}>미리보기</Button>}
          <Button variant="outline" size="sm" onClick={() => removeItem(ed, 'bulletins', i, b.title)}>삭제</Button>
        </>}><div>{b.title}</div><Meta>{md(b.date)}{b.file ? ' · ' + b.file : ''}</Meta></Row>
      ))}</ItemList>
    </Panel>
  );
}

export function NoticesPanel() {
  const ed = useEd(), list = ed.data.notices;
  const [title, setTitle] = useState(''), [body, setBody] = useState(''), [bad, setBad] = useState(false);
  const submit = () => {
    setBad(!title.trim());
    if (!title.trim()) { document.getElementById('nt-title')?.focus(); return; }
    ed.setList('notices', a => [{ title: title.trim(), body: body.trim(), date: today }, ...a]);
    setTitle(''); setBody('');
    ed.toast('공지를 저장했어요. 홈페이지의 ‘공지사항’에 바로 반영됐습니다.');
  };
  return (
    <Panel title="공지 등록">
      <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
        <div className="grid gap-1.5"><Label htmlFor="nt-title">제목 (필수)</Label><Input id="nt-title" autoComplete="off" placeholder="예: 성탄 축하 발표회 연습 안내" aria-invalid={bad} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="nt-body">내용</Label><Textarea id="nt-body" className="min-h-[110px] text-base" placeholder="공지 내용을 입력하세요" value={body} onChange={e => setBody(e.target.value)} /><Hint>내용을 쓰면 홈페이지에서 공지 제목을 눌러 펼쳐 볼 수 있어요.</Hint></div>
        {bad && <FormError>제목을 입력해 주세요.</FormError>}
        <div><Button type="submit">저장</Button></div>
      </form>
      <ListTitle>등록된 공지</ListTitle>
      <ItemList>{list.map((n, i) => (
        <Row key={i} actions={<Button variant="outline" size="sm" onClick={() => removeItem(ed, 'notices', i, n.title)}>삭제</Button>}><div>{n.title}</div><Meta>{md(n.date)}</Meta></Row>
      ))}</ItemList>
    </Panel>
  );
}

export function StaffPanel() {
  const ed = useEd(), list = ed.data.staff;
  const [name, setName] = useState(''), [role, setRole] = useState(''), [bad, setBad] = useState(false);
  const submit = () => {
    setBad(!name.trim());
    if (!name.trim()) { document.getElementById('st-name')?.focus(); return; }
    const n = name.trim();
    ed.setList('staff', a => [...a, { name: n, role: role.trim() }]);
    setName(''); setRole('');
    ed.toast(`${n} 님을 추가했어요. 홈페이지의 ‘섬기는 분들’에 바로 반영됐습니다.`);
  };
  return (
    <Panel title="섬기는 분 추가">
      <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
        <div className="grid gap-1.5"><Label htmlFor="st-name">이름 (필수)</Label><Input id="st-name" autoComplete="off" placeholder="예: 김○○" aria-invalid={bad} value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="st-role">직분</Label><Input id="st-role" autoComplete="off" placeholder="예: 담임목사" value={role} onChange={e => setRole(e.target.value)} /></div>
        {bad && <FormError>이름을 입력해 주세요.</FormError>}
        <div><Button type="submit">추가</Button></div>
      </form>
      <ListTitle>섬기는 분들 (홈페이지에 이 순서로 나와요)</ListTitle>
      <ItemList>{list.map((s, i) => (
        <Row key={i} actions={<>
          <Button variant="outline" size="sm" aria-label={`${s.name} 위로`} disabled={i === 0} onClick={() => moveItem(ed, 'staff', i, -1)}>↑</Button>
          <Button variant="outline" size="sm" aria-label={`${s.name} 아래로`} disabled={i === list.length - 1} onClick={() => moveItem(ed, 'staff', i, 1)}>↓</Button>
          <Button variant="outline" size="sm" onClick={() => removeItem(ed, 'staff', i, s.name)}>삭제</Button>
        </>}><div>{s.name}</div><Meta>{s.role}</Meta></Row>
      ))}</ItemList>
    </Panel>
  );
}

export function GalleryPanel() {
  const ed = useEd(), list = ed.data.gallery;
  const [files, setFiles] = useState<File[]>([]), [fileKey, setFileKey] = useState(0), [err, setErr] = useState('');
  const submit = async () => {
    setErr('');
    if (!files.length) return setErr('올릴 사진을 먼저 골라 주세요.');
    if (list.length + files.length > GALLERY_MAX) return setErr(`사진은 최대 ${GALLERY_MAX}장까지 올릴 수 있어요. 지금 ${list.length}장이라 ${GALLERY_MAX - list.length}장까지 더 올릴 수 있어요.`);
    if (files.some(f => !/^image\/(jpeg|png|webp)$/.test(f.type))) return setErr('JPG, PNG, WEBP 사진만 올릴 수 있어요.');
    if (files.some(f => f.size > 20 * 1024 * 1024)) return setErr('한 장당 20MB 이하 사진만 올릴 수 있어요.');
    let urls: string[];
    try { urls = await Promise.all(files.map(f => shrink(f, 1000))); } catch { return setErr('사진을 읽지 못했어요. 다른 사진으로 다시 해 주세요.'); }
    const n = files.length;
    ed.setList('gallery', a => [...a, ...urls.map((image, i) => ({ image, title: files[i].name }))]);
    setFiles([]); setFileKey(k => k + 1);
    ed.toast(`사진 ${n}장을 추가했어요. 홈페이지의 ‘갤러리’에 바로 반영됐습니다.`);
  };
  return (
    <Panel title="갤러리 사진 추가">
      <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); void submit(); }}>
        <div className="grid gap-1.5">
          <Label htmlFor="gl-file">사진 (여러 장을 한 번에 고를 수 있어요)</Label>
          <Input key={fileKey} id="gl-file" type="file" multiple accept="image/jpeg,image/png,image/webp" className="pt-2" onChange={e => setFiles(Array.from(e.target.files ?? []))} />
          <Hint>JPG·PNG·WEBP, 한 장당 20MB 이하. 최대 {GALLERY_MAX}장까지 올릴 수 있어요.</Hint>
        </div>
        {err && <FormError>{err}</FormError>}
        <div><Button type="submit">추가</Button></div>
      </form>
      <ListTitle>올린 사진 (홈페이지에 이 순서로 나와요)</ListTitle>
      <ItemList>{list.map((g, i) => (
        <Row key={i} actions={<>
          <Button variant="outline" size="sm" aria-label={`${i + 1}번째 사진 앞으로`} disabled={i === 0} onClick={() => moveItem(ed, 'gallery', i, -1)}>↑</Button>
          <Button variant="outline" size="sm" aria-label={`${i + 1}번째 사진 뒤로`} disabled={i === list.length - 1} onClick={() => moveItem(ed, 'gallery', i, 1)}>↓</Button>
          <Button variant="outline" size="sm" onClick={() => removeItem(ed, 'gallery', i, g.title)}>삭제</Button>
        </>}>
          <div className="flex min-w-0 items-center gap-3"><img src={safeImg(g.image)} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" /><span>{g.title}</span></div>
        </Row>
      ))}</ItemList>
    </Panel>
  );
}
