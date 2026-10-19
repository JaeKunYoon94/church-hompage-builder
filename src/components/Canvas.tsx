import { Fragment, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { TYPES } from '@/constants';
import { cn } from '@/lib/utils';
import { useEd } from '@/store';
import type { Block } from '@/types';
import { Site } from './Site';

const DropLine = () => <div className="drop-line"><span>여기에 놓기</span></div>;

/** center pane: the draft page with editing chrome, or the published page when viewing the live site */
export function Canvas() {
  const ed = useEd(), { data, ui } = ed;
  const live = ui.view === 'live', doc = live ? data.published : data.draft;
  const blocksEl = useRef<HTMLDivElement>(null);

  const indexAt = (y: number) => {
    const xs = Array.from(blocksEl.current?.children ?? []).filter(n => n.classList.contains('blk'));
    for (let i = 0; i < xs.length; i++) { const r = xs[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; }
    return xs.length;
  };

  const drop = (e: React.DragEvent) => {
    const d = ed.drag.current; if (!d) return;
    e.preventDefault();
    const idx = indexAt(e.clientY), bl = data.draft.blocks;
    ed.endDrag();
    let id: string;
    if (d.kind === 'new') {
      const ex = bl.find(b => b.type === d.type);
      if (!ex) { ed.addBlock(d.type, idx); return; }
      id = ex.id; // already on the page: move it to the drop spot instead of adding a second one
    } else id = d.id;
    const from = bl.findIndex(b => b.id === id);
    let to = idx; if (from < to) to--;
    if (ed.relocate(id, to)) ed.toast(`‘${TYPES[bl[from].type].name}’ 블록을 옮겼어요.`);
  };

  const frame = (b: Block, i: number, body: React.ReactNode) => {
    const name = TYPES[b.type].name, sel = ui.sel === b.id;
    const act = (a: 'up' | 'down' | 'hide' | 'del') => (e: React.MouseEvent) => { e.stopPropagation(); ed.blockAct(a, b.id); };
    return (
      <Fragment key={b.id}>
        {ed.dropAt === i && <DropLine />}
        <section className={cn('blk s-sec', 't-' + b.type, 'bg-' + (b.props.bg || 'white'), b.hidden && 'is-hidden', sel && 'sel', ed.draggingId === b.id && 'dragging')}
          data-id={b.id} draggable tabIndex={0} aria-label={`${name} 블록${b.hidden ? ', 숨김' : ''}`}
          onClick={e => { if ((e.target as HTMLElement).closest('a[href]')) e.preventDefault(); /* editing: a click selects, links open only on the live site */ if (!sel) { ed.endTyping(); ed.patchUi({ sel: b.id }); } }}
          onKeyDown={e => {
            if (e.target !== e.currentTarget) return;
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); ed.moveBlock(b.id, e.key === 'ArrowUp' ? -1 : 1); }
            else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ed.patchUi({ sel: b.id }); }
            else if (e.key === 'Delete') { e.preventDefault(); ed.blockAct('del', b.id); }
          }}
          onDragStart={e => { ed.drag.current = { kind: 'move', id: b.id }; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', b.id); } catch { /* some browsers refuse */ } requestAnimationFrame(() => ed.setDraggingId(b.id)); }}
          onDragEnd={ed.endDrag}>
          <div className="blk-tag">{name}{TYPES[b.type].auto ? ' · 자동' : ''}{b.hidden ? ' · 숨김 (공개 사이트에 안 보임)' : ''}</div>
          <div className="tools" role="toolbar" aria-label={`${name} 블록 도구`}>
            <span className="tools-name">{name}{b.hidden ? ' · 숨김' : ''}</span>
            <span className="grip" aria-hidden="true">⠿ 끌어서 이동</span>
            <button type="button" onClick={act('up')}>↑ 위로</button>
            <button type="button" onClick={act('down')}>↓ 아래로</button>
            <button type="button" onClick={act('hide')}>{b.hidden ? '보이기' : '숨기기'}</button>
            <button type="button" className="danger" onClick={act('del')}>삭제</button>
          </div>
          {body}
        </section>
      </Fragment>
    );
  };

  return (
    <section aria-label="페이지 미리보기"
      className={cn('min-w-0 rounded-[20px] border-2 border-dashed border-transparent bg-canvas p-5 transition-colors max-md:p-2', live && ui.device === 'pc' && 'p-0 max-md:p-0 rounded-none', ed.dropAt !== null && 'border-ring bg-accent')}
      onClick={e => { if (!live && !(e.target as HTMLElement).closest('.site') && ui.sel) ed.patchUi({ sel: null }); }}
      onDragOver={e => { if (!ed.drag.current || live) return; e.preventDefault(); e.dataTransfer.dropEffect = ed.drag.current.kind === 'new' ? 'copy' : 'move'; ed.setDropAt(indexAt(e.clientY)); }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) ed.setDropAt(null); }}
      onDrop={drop}>
      <div className="mx-auto mb-3 flex max-w-[1000px] flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {live
          ? <><span><strong className="text-foreground">방문자에게 보이는 화면</strong> · 마지막으로 발행한 내용입니다</span>{ed.dirty && <span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full bg-ring" />발행 안 된 변경이 있어요. ‘페이지 편집’에서 발행하세요</span>}</>
          : <>
            <span><strong className="text-foreground">초안</strong> · 방문자에게는 발행 후에 보입니다 · 블록을 누르면 오른쪽에서 고칠 수 있어요</span>
            <span className="flex gap-2">
              <Button variant="outline" size="sm" onClick={ed.undo} disabled={!ed.canUndo} title="실행 취소 (Ctrl+Z)">실행 취소</Button>
              <Button variant="outline" size="sm" onClick={ed.redo} disabled={!ed.canRedo} title="다시 실행 (Ctrl+Shift+Z)">다시 실행</Button>
            </span>
          </>}
      </div>
      <Site doc={doc} lists={data} device={ui.device} editable={!live}
        wrapBlock={live ? undefined : (b, i, body) => frame(b, i, body)}
        tail={!live && ed.dropAt === doc.blocks.length ? <DropLine /> : undefined}
        blocksRef={blocksEl} />
    </section>
  );
}
