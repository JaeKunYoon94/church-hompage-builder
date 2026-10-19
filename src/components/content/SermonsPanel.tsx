import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { md, today, ytFromInput, ytInfo, ytThumb, ytWatch } from '@/lib/util';
import { removeItem } from '@/lib/lists';
import { useEd } from '@/store';
import { FormError, Hint, ItemList, ListTitle, Meta, Panel, Row } from './parts';

const DEFAULT_PREACHER = '김○○ 목사';
interface YtPreview { id: string; title: string; msg: string }

/** the sermon form doubles as the edit form: `editIdx` is the sermon being changed, null when adding */
export function SermonsPanel() {
  const ed = useEd(), sermons = ed.data.sermons;
  const [url, setUrl] = useState(''), [title, setTitle] = useState(''), [verse, setVerse] = useState('');
  const [preacher, setPreacher] = useState(DEFAULT_PREACHER), [date, setDate] = useState(today);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [problem, setProblem] = useState('');
  const [yt, setYt] = useState<YtPreview | null>(null);
  const req = useRef(0), titleAuto = useRef(false), titleRef = useRef(title);
  titleRef.current = title;

  // paste → thumbnail and title from YouTube's oEmbed; the title is filled only while the field is empty or still holds an auto title
  useEffect(() => {
    const raw = url.trim(), my = ++req.current;
    if (!raw) { setYt(null); return; }
    const id = ytFromInput(raw);
    if (!id) { setYt({ id: '', title: '', msg: '유튜브 영상 주소가 아니에요. 주소를 다시 확인해 주세요.' }); return; }
    setYt({ id, title: '', msg: '영상 정보를 가져오는 중…' });
    const timer = setTimeout(async () => {
      try {
        const info = await ytInfo(id);
        if (my !== req.current) return;
        setYt({ id, title: info.title || '', msg: info.author_name ? `채널: ${info.author_name}` : '' });
        if (info.title && (!titleRef.current.trim() || titleAuto.current)) { titleAuto.current = true; setTitle(info.title); }
      } catch {
        if (my !== req.current) return;
        setYt({ id, title: '', msg: '유튜브에 연결하지 못했어요. 인터넷 연결을 확인해 주세요. 제목을 비워 두면 날짜로 저장돼요.' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [url]);

  const reset = () => { setEditIdx(null); setUrl(''); setTitle(''); setVerse(''); setPreacher(DEFAULT_PREACHER); setDate(today); setProblem(''); titleAuto.current = false; };
  const startEdit = (i: number) => {
    const s = sermons[i]; if (!s) return;
    titleAuto.current = false;
    setEditIdx(i); setUrl(s.url || ''); setTitle(s.title || ''); setVerse(s.verse || ''); setPreacher(s.preacher || ''); setDate(s.date || today); setProblem('');
    setTimeout(() => { document.getElementById('sm-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('sm-title')?.focus({ preventScroll: true }); }, 0);
  };

  const submit = () => {
    // title is optional: where YouTube cannot be reached it never auto-fills, and a required title blocked the save
    const d = date || today, raw = url.trim(), vid = ytFromInput(raw);
    const bad = raw && !vid ? '유튜브 퍼가기 코드나 링크를 확인해 주세요. 비워 두어도 저장할 수 있어요.' : '';
    setProblem(bad);
    if (bad) { document.getElementById('sm-url')?.focus(); return; }
    const rec = { title: title.trim() || `${md(d)} 설교`, verse: verse.trim(), preacher: preacher.trim(), date: d, url: vid ? ytWatch(vid) : '', vid };
    const wasEdit = editIdx !== null && !!sermons[editIdx];
    ed.setList('sermons', a => {
      const n = wasEdit ? a.map((s, i) => i === editIdx ? { ...s, ...rec } : s) : [rec, ...a];
      return n.sort((x, y) => (y.date || '').localeCompare(x.date || ''));
    });
    reset();
    ed.toast(wasEdit ? '설교를 수정했어요. 홈페이지에 바로 반영됐습니다.' : '설교를 저장했어요. 홈페이지의 ‘최근 설교’에 바로 반영됐습니다.', '홈페이지에서 보기', () => {
      ed.patchUi({ view: 'edit' });
      setTimeout(() => document.querySelector('.blk .s-sermons')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    });
  };

  return (
    <Panel title={editIdx === null ? '설교 등록' : '설교 수정'}>
      <form className="grid gap-3.5" noValidate onSubmit={e => { e.preventDefault(); submit(); }}>
        <div className="grid gap-1.5">
          <Label htmlFor="sm-url">유튜브 퍼가기 코드</Label>
          <Textarea id="sm-url" rows={3} autoComplete="off" spellCheck={false} className="min-h-[84px] font-mono text-sm" value={url} onChange={e => setUrl(e.target.value)}
            placeholder={'<iframe width="560" height="315" src="https://www.youtube.com/embed/..." ...></iframe>'} />
          <Hint>유튜브 영상 아래 ‘공유 › 퍼가기’를 누르면 나오는 코드를 그대로 붙여넣으세요. 영상 링크를 넣어도 돼요. 붙여넣으면 제목과 썸네일을 가져와요.</Hint>
          {yt && (
            <div className="mt-1 flex items-center gap-3 rounded-xl border bg-muted p-2.5">
              {yt.id && <img src={ytThumb(yt.id)} alt="" className="aspect-video w-32 shrink-0 rounded-md bg-[#2b2f36] object-cover" onError={e => { e.currentTarget.hidden = true; }} />}
              <div className="min-w-0"><p className="font-semibold [overflow-wrap:anywhere]">{yt.title}</p><Hint>{yt.msg}</Hint></div>
            </div>
          )}
        </div>
        <div className="grid gap-1.5"><Label htmlFor="sm-title">제목</Label><Input id="sm-title" autoComplete="off" placeholder="비워 두면 ‘2026년 10월 18일 설교’처럼 날짜로 저장돼요" value={title} onChange={e => { titleAuto.current = false; setTitle(e.target.value); }} /></div>
        <div className="grid gap-1.5"><Label htmlFor="sm-verse">본문 말씀</Label><Input id="sm-verse" autoComplete="off" placeholder="예: 요한복음 21:15-17" value={verse} onChange={e => setVerse(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="sm-preacher">설교자</Label><Input id="sm-preacher" autoComplete="off" value={preacher} onChange={e => setPreacher(e.target.value)} /></div>
        <div className="grid gap-1.5"><Label htmlFor="sm-date">날짜</Label><Input id="sm-date" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        {problem && <FormError>{problem}</FormError>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{editIdx === null ? '저장' : '수정 저장'}</Button>
          {editIdx !== null && <Button type="button" variant="outline" onClick={reset}>수정 취소</Button>}
        </div>
      </form>
      <ListTitle>등록된 설교</ListTitle>
      <ItemList>{sermons.map((s, i) => (
        <Row key={i} editing={i === editIdx} actions={<>
          <Button variant="outline" size="sm" onClick={() => startEdit(i)}>수정</Button>
          <Button variant="outline" size="sm" onClick={() => { if (i === editIdx) reset(); else if (editIdx !== null && i < editIdx) setEditIdx(editIdx - 1); removeItem(ed, 'sermons', i, s.title); }}>삭제</Button>
        </>}>
          <div>{s.title}</div><Meta>{md(s.date)} · {s.verse} · {s.preacher}{s.vid ? ' · 영상 연결됨' : ''}</Meta>
        </Row>
      ))}</ItemList>
    </Panel>
  );
}
