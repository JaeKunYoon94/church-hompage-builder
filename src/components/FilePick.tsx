import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/** file input behind a button-looking label; hands back the chosen files and resets the input so the same file can be picked again */
export function FilePick({ accept, multiple, onFiles, children, variant = 'outline' }: {
  accept: string; multiple?: boolean; onFiles: (files: File[]) => void; children: ReactNode; variant?: 'outline' | 'default';
}) {
  return (
    <Button asChild variant={variant} className="cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
      <label>
        {children}
        <input type="file" accept={accept} multiple={multiple} className="sr-only"
          onChange={e => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) onFiles(f); }} />
      </label>
    </Button>
  );
}
