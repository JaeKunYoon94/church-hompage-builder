import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** one content panel: titled card */
export function Panel({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export const ListTitle = ({ children }: { children: ReactNode }) => <h3 className="mt-6 mb-1.5 text-[15px] font-semibold text-muted-foreground">{children}</h3>;

export function ItemList({ children }: { children: ReactNode }) {
  return <ul className="m-0 list-none p-0">{children}{!children || (Array.isArray(children) && children.length === 0) ? <li className="border-t py-2.5 text-sm text-muted-foreground">아직 없습니다.</li> : null}</ul>;
}

export function Row({ children, actions, editing }: { children: ReactNode; actions: ReactNode; editing?: boolean }) {
  return (
    <li className={cn('flex items-center justify-between gap-3 border-t py-2.5', editing && '-mx-2 rounded-lg bg-accent px-2')}>
      <div className="min-w-0 [overflow-wrap:anywhere]">{children}</div>
      <div className="flex shrink-0 gap-1.5">{actions}</div>
    </li>
  );
}
export const Meta = ({ children }: { children: ReactNode }) => <div className="text-sm text-muted-foreground">{children}</div>;
export const FormError = ({ children }: { children: ReactNode }) => <p role="alert" className="rounded-lg border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-[15px]">{children}</p>;
export const Hint = ({ children }: { children: ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;
