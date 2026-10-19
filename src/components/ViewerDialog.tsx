import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEd } from '@/store';

/** full-screen-ish viewer for bulletin pages, gallery photos and the policy documents (focus trap, Esc and focus return come from Radix) */
export function ViewerDialog() {
  const ed = useEd(), v = ed.viewer;
  return (
    <Dialog open={!!v} onOpenChange={open => { if (!open) ed.closeViewer(); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-[900px] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader><DialogTitle>{v?.title}</DialogTitle><DialogDescription className="sr-only">{v?.title} 크게 보기</DialogDescription></DialogHeader>
        <div className="grid justify-items-center gap-4 [&_img]:h-auto [&_img]:w-full [&_img]:rounded-xl [&_img]:bg-white">{v?.node}</div>
      </DialogContent>
    </Dialog>
  );
}
