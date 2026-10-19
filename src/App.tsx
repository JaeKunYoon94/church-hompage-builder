import { useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { EditorCtx, useEditor } from '@/store';
import { BlockManager } from './components/BlockManager';
import { Canvas } from './components/Canvas';
import { ContentView } from './components/ContentView';
import { Inspector } from './components/Inspector';
import { Topbar } from './components/Topbar';
import { ViewerDialog } from './components/ViewerDialog';

export default function App() {
  const ed = useEditor(), { view } = ed.ui;

  // Ctrl/Cmd+Z, Shift for redo — only on the edit screen and never while typing in a field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = document.activeElement;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (view !== 'edit' || !(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) ed.redo(); else ed.undo();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <EditorCtx.Provider value={ed}>
      <Topbar />
      <main className={`mx-auto grid grid-cols-[minmax(0,1fr)] gap-4 pt-4 pb-[72px] ${view === 'live' ? 'px-0' : 'max-w-[1600px] px-4'}`}>
        {view === 'content' ? <ContentView /> : (
          <div className={view === 'live' ? 'grid grid-cols-[minmax(0,1fr)] items-start gap-4' : 'grid grid-cols-[minmax(0,1fr)] items-start gap-4 min-[721px]:grid-cols-[212px_minmax(0,1fr)] min-[1101px]:grid-cols-[232px_minmax(0,1fr)_300px]'}>
            {view === 'edit' && <BlockManager />}
            <Canvas />
            {view === 'edit' && <Inspector />}
          </div>
        )}
      </main>
      <ViewerDialog />
      <Toaster position="bottom-center" />
    </EditorCtx.Provider>
  );
}
