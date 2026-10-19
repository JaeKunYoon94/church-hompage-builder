import { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SHELF, TYPES } from '@/constants';
import { cn } from '@/lib/utils';
import { useEd } from '@/store';

/** left pane: the page's blocks in order (drag or ↑↓ to reorder), then the block types that can be added */
export function BlockManager() {
  const ed = useEd(), blocks = ed.data.draft.blocks;
  const [dragId, setDragId] = useState<string | null>(null);
  const [mark, setMark] = useState<{ id: string; after: boolean } | null>(null);

  const markAt = (e: React.DragEvent<HTMLOListElement>) => { // nearest row to the pointer
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-ord]'));
    let last: HTMLElement | null = null;
    for (const li of rows) { const r = li.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) return { id: li.dataset.ord!, after: false }; last = li; }
    return last ? { id: last.dataset.ord!, after: true } : null;
  };
  const drop = (e: React.DragEvent<HTMLOListElement>) => {
    if (!dragId) return;
    e.preventDefault();
    const m = markAt(e), id = dragId;
    setDragId(null); setMark(null);
    const from = blocks.findIndex(b => b.id === id);
    let to = m ? blocks.findIndex(b => b.id === m.id) + (m.after ? 1 : 0) : blocks.length;
    if (from < to) to--;
    if (ed.relocate(id, to)) ed.toast(`‘${TYPES[blocks[from].type].name}’ 블록을 옮겼어요.`, '실행 취소', ed.undo);
  };

  return (
    <aside className="rounded-xl border bg-card p-4 min-[721px]:sticky min-[721px]:top-[76px] min-[721px]:max-h-[calc(100vh-96px)] min-[721px]:overflow-auto" aria-label="블록 관리">
      <h2 className="text-base font-semibold">블록 관리</h2>
      <p className="mb-3 text-sm text-muted-foreground">끌어서 순서를 바꾸거나 ↑↓ 버튼으로 옮기세요. 블록은 종류마다 하나씩 둘 수 있어요.</p>

      <h3 className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">페이지 순서</h3>
      <ol className="grid gap-1" onDragOver={e => { if (!dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setMark(markAt(e)); }} onDrop={drop}>
        {blocks.length === 0 && <li className="text-sm text-muted-foreground">아직 블록이 없어요. 아래에서 추가하세요.</li>}
        {blocks.map((b, i) => {
          const name = TYPES[b.type].name;
          return (
            <li key={b.id} data-ord={b.id} draggable
              className={cn('flex min-h-11 cursor-grab items-center gap-1 rounded-lg border bg-card py-0.5 pr-1 pl-2 select-none',
                b.id === ed.ui.sel && 'border-primary bg-accent', b.id === dragId && 'opacity-40',
                mark?.id === b.id && (mark.after ? 'shadow-[0_3px_0_var(--ring)]' : 'shadow-[0_-3px_0_var(--ring)]'))}
              onDragStart={e => { if (ed.ui.view !== 'edit') { e.preventDefault(); return; } e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', b.id); } catch { /* some browsers refuse */ } requestAnimationFrame(() => setDragId(b.id)); }}
              onDragEnd={() => { setDragId(null); setMark(null); }}>
              <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <button type="button" className="min-w-0 flex-1 cursor-pointer py-2 text-left text-[15px] font-semibold [overflow-wrap:anywhere]"
                onClick={() => { ed.patchUi({ sel: b.id }); setTimeout(() => document.querySelector(`.blk[data-id="${b.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }}>
                {name}{b.hidden && <span className="ml-1 text-[13px] font-medium text-muted-foreground">(숨김)</span>}
              </button>
              <Button variant="ghost" size="icon-sm" aria-label={`${name} 위로 옮기기`} disabled={i === 0} onClick={() => ed.moveBlock(b.id, -1)}><ChevronUp /></Button>
              <Button variant="ghost" size="icon-sm" aria-label={`${name} 아래로 옮기기`} disabled={i === blocks.length - 1} onClick={() => ed.moveBlock(b.id, 1)}><ChevronDown /></Button>
            </li>
          );
        })}
      </ol>

      <h3 className="mt-4 mb-2 text-sm font-semibold text-muted-foreground">블록 추가</h3>
      <div className="grid gap-2 max-[720px]:flex max-[720px]:overflow-x-auto max-[720px]:pb-1">
        {SHELF.map(t => {
          const used = blocks.some(b => b.type === t), tag = used ? '페이지에 있음' : TYPES[t].auto ? '자동' : '';
          return (
            <button key={t} type="button" draggable onClick={() => ed.addBlock(t)}
              className={cn('grid min-h-14 cursor-grab content-start gap-px rounded-xl border p-2.5 text-left select-none hover:border-ring max-[720px]:shrink-0 max-[720px]:basis-[168px]', used ? 'bg-muted' : 'bg-card')}
              onDragStart={e => { ed.drag.current = { kind: 'new', type: t }; e.dataTransfer.effectAllowed = 'copyMove'; try { e.dataTransfer.setData('text/plain', t); } catch { /* some browsers refuse */ } }}
              onDragEnd={ed.endDrag}>
              <span className="font-semibold">{TYPES[t].name}</span>
              <span className="text-[13px] text-muted-foreground">{TYPES[t].desc}</span>
              {tag && <span className={cn('mt-1.5 justify-self-start rounded-md px-2.5 py-0.5 text-[13px]', used ? 'bg-border text-muted-foreground' : 'bg-accent text-accent-foreground')}>{tag}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
