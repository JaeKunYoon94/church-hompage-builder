import type { Editor } from '@/store';
import type { ListKey } from '@/types';

type Arr = unknown[];

/** swap item `i` with its neighbour (`d` = -1 or 1) in a content list */
export function moveItem(ed: Editor, key: ListKey, i: number, d: number) {
  ed.setList(key, ((a: Arr) => {
    const n = [...a], j = i + d;
    if (j < 0 || j >= n.length) return n;
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  }) as never);
}

/** delete item `i`; the toast offers to put it back where it was */
export function removeItem(ed: Editor, key: ListKey, i: number, label: string) {
  const gone = (ed.data[key] as Arr)[i];
  ed.setList(key, ((a: Arr) => a.filter((_, k) => k !== i)) as never);
  ed.toast(`‘${label}’을(를) 삭제했어요.`, '되돌리기', () => ed.setList(key, ((a: Arr) => { const n = [...a]; n.splice(i, 0, gone); return n; }) as never));
}
