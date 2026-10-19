import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast as sonner } from 'sonner';
import { COLORS, KEY, TYPES, isBlockType } from './constants';
import { clone, loadData, mk } from './lib/util';
import type { AppData, BlockType, CTab, Device, Doc, ListKey, Lists, View } from './types';

export interface UiState { view: View; device: Device; sel: string | null; ctab: CTab }
export interface ViewerContent { title: string; node: ReactNode }
export type Drag = { kind: 'new'; type: BlockType } | { kind: 'move'; id: string };

/**
 * All editor state in one hook. `data` is replaced, never mutated: `edit` changes the draft (undoable),
 * `setList` changes a content list (saved at once, no undo, the caller offers 되돌리기 where it matters).
 * Refs hold the latest values so handlers never read a stale render.
 */
export function useEditor() {
  const [data, setData] = useState<AppData>(loadData);
  const dataRef = useRef(data);
  const [ui, setUi] = useState<UiState>({ view: 'edit', device: 'pc', sel: null, ctab: 'sermons' });
  const uiRef = useRef(ui);
  const undoRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const typing = useRef(false);
  /** bumps on undo/redo/revert so the inspector remounts and its fields re-read the draft */
  const [rev, setRev] = useState(0);
  const [saveMsg, setSaveMsg] = useState('초안은 자동으로 저장됩니다');
  const [viewer, setViewer] = useState<ViewerContent | null>(null);
  const drag = useRef<Drag | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const patchUi = (p: Partial<UiState>) => { uiRef.current = { ...uiRef.current, ...p }; setUi(uiRef.current); };

  function commit(next: AppData) {
    dataRef.current = next; setData(next);
    let ok = true;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { ok = false; }
    const t = new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
    setSaveMsg(ok ? `초안 자동 저장됨 · ${t}` : '이 브라우저에 저장하지 못했어요. 창을 닫으면 바뀐 내용이 사라집니다.');
  }

  const pushUndo = () => { undoRef.current.push(JSON.stringify(dataRef.current.draft)); if (undoRef.current.length > 60) undoRef.current.shift(); redoRef.current = []; };
  /** change the draft; `isTyping` edits share one undo step until the field loses focus */
  function edit(fn: (d: Doc) => void, isTyping = false) {
    if (!(isTyping && typing.current)) pushUndo();
    typing.current = isTyping;
    const cur = dataRef.current, draft = clone(cur.draft);
    fn(draft);
    commit({ ...cur, draft });
  }
  const endTyping = () => { typing.current = false; };

  function setList<K extends ListKey>(key: K, fn: (arr: Lists[K]) => Lists[K]) {
    const cur = dataRef.current;
    commit({ ...cur, [key]: fn(cur[key]) } as AppData);
  }

  /** a message with an optional action button (실행 취소 / 되돌리기); sonner shows it and removes it after a few seconds */
  function toast(msg: string, label?: string, fn?: () => void) {
    sonner(msg, { duration: label ? 7000 : 4000, action: label && fn ? { label, onClick: fn } : undefined });
  }

  function applyDraft(draft: Doc) {
    commit({ ...dataRef.current, draft });
    if (!draft.blocks.some(b => b.id === uiRef.current.sel)) patchUi({ sel: null });
    typing.current = false; setRev(r => r + 1);
  }
  function undo() {
    if (!undoRef.current.length) return;
    redoRef.current.push(JSON.stringify(dataRef.current.draft));
    applyDraft(JSON.parse(undoRef.current.pop()!));
  }
  function redo() {
    if (!redoRef.current.length) return;
    undoRef.current.push(JSON.stringify(dataRef.current.draft));
    applyDraft(JSON.parse(redoRef.current.pop()!));
  }

  function publish() {
    const cur = dataRef.current;
    commit({ ...cur, prev: cur.published, published: clone(cur.draft) });
    toast('발행했어요. 공개 홈페이지에 반영됐습니다.', '이전 발행본으로 되돌리기', () => {
      const c = dataRef.current; if (!c.prev) return;
      pushUndo();
      commit({ ...c, draft: clone(c.prev), published: c.prev, prev: null });
      if (!c.prev.blocks.some(b => b.id === uiRef.current.sel)) patchUi({ sel: null });
      setRev(r => r + 1);
      toast('이전 발행본으로 되돌렸어요.');
    });
  }

  // ---- blocks ----
  const scrollToBlock = (id: string) => setTimeout(() => document.querySelector(`.blk[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  /** put block `id` at index `to` (index in the list after removing it) */
  function relocate(id: string, to: number) {
    const bl = dataRef.current.draft.blocks, from = bl.findIndex(b => b.id === id);
    if (from < 0 || from === to) return false;
    edit(d => { const [b] = d.blocks.splice(from, 1); d.blocks.splice(to, 0, b); });
    patchUi({ sel: id });
    return true;
  }
  const moveBlock = (id: string, delta: number) => {
    const i = dataRef.current.draft.blocks.findIndex(b => b.id === id), j = i + delta;
    return i >= 0 && j >= 0 && j < dataRef.current.draft.blocks.length && relocate(id, j);
  };
  function addBlock(type: BlockType, idx?: number) {
    const bl = dataRef.current.draft.blocks, existing = bl.find(b => b.type === type);
    if (existing) {
      patchUi({ sel: existing.id }); scrollToBlock(existing.id);
      toast(`‘${TYPES[type].name}’ 블록은 한 페이지에 하나만 둘 수 있어요. 지금 있는 블록을 선택했어요.`);
      return;
    }
    if (idx == null) { const s = bl.findIndex(b => b.id === uiRef.current.sel); idx = s > -1 ? s + 1 : bl.length; }
    const b = mk(type), at = idx;
    edit(d => { d.blocks.splice(at, 0, b); });
    patchUi({ sel: b.id }); scrollToBlock(b.id);
    toast(`‘${TYPES[type].name}’ 블록을 추가했어요.`);
  }
  function blockAct(a: 'up' | 'down' | 'hide' | 'del', id: string) {
    const b = dataRef.current.draft.blocks.find(x => x.id === id); if (!b) return;
    const name = TYPES[b.type].name;
    if (a === 'up' || a === 'down') { if (!moveBlock(id, a === 'up' ? -1 : 1)) toast(a === 'up' ? '이미 맨 위에 있어요.' : '이미 맨 아래에 있어요.'); }
    else if (a === 'hide') { edit(d => { const x = d.blocks.find(y => y.id === id)!; x.hidden = !x.hidden; }); patchUi({ sel: id }); toast(!b.hidden ? `‘${name}’을(를) 숨겼어요. 공개 사이트에는 보이지 않아요.` : `‘${name}’을(를) 다시 보이게 했어요.`); }
    else { edit(d => { d.blocks = d.blocks.filter(x => x.id !== id); }); patchUi({ sel: null }); toast(`‘${name}’ 블록을 삭제했어요.`, '실행 취소', undo); }
  }

  // ---- full-screen viewer (bulletin pages, gallery photo, policy documents) ----
  // the dialog hands focus back to whatever opened it
  const openViewer = (title: string, node: ReactNode) => setViewer({ title, node });
  const closeViewer = () => setViewer(null);

  function endDrag() { drag.current = null; setDropAt(null); setDraggingId(null); }

  // index.html (landing page) links here with ?blocks=a,b&color=k to start from a sample layout; applied once and undoable, content lists stay as they are
  const startApplied = useRef(false);
  useEffect(() => {
    if (startApplied.current) return;
    startApplied.current = true;
    const q = new URLSearchParams(location.search);
    const want = (q.get('blocks') || '').split(',').filter((t, i, a) => isBlockType(t) && a.indexOf(t) === i) as BlockType[];
    if (!want.length) return;
    const cur = dataRef.current, clean = JSON.stringify(cur.draft) === JSON.stringify(cur.published);
    pushUndo();
    const draft = clone(cur.draft), c = q.get('color');
    draft.blocks = want.map(mk);
    if (c && COLORS[c]) draft.color = c;
    const d = q.get('design'); if (d === 'warm' || d === 'navy') draft.design = d; else delete draft.design; // a sample always brings its own look
    commit({ ...cur, draft, published: clean ? clone(draft) : cur.published });
    history.replaceState(null, '', location.pathname);
    toast('선택한 샘플 구성으로 시작했어요.', '실행 취소', undo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = JSON.stringify(data.draft) !== JSON.stringify(data.published);

  return {
    data, ui, rev, saveMsg, dirty, viewer, dropAt, draggingId, drag,
    canUndo: undoRef.current.length > 0, canRedo: redoRef.current.length > 0,
    patchUi, edit, endTyping, setList, toast, undo, redo, publish,
    moveBlock, relocate, addBlock, blockAct, openViewer, closeViewer, setDropAt, setDraggingId, endDrag
  };
}

export type Editor = ReturnType<typeof useEditor>;
export const EditorCtx = createContext<Editor>(null as never);
export const useEd = () => useContext(EditorCtx);
