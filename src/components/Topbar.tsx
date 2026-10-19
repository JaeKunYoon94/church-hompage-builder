import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { accentOf, nameOf } from '@/lib/util';
import { useEd } from '@/store';
import type { Device, View } from '@/types';
import { Logo } from './icons';

export function Topbar() {
  const ed = useEd(), { data, ui } = ed;
  return (
    <header className="sticky top-0 z-20 border-b bg-card max-md:static">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2.5 px-4 py-2.5">
        <div className="mr-auto flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="grid size-[38px] shrink-0 place-items-center rounded-lg border bg-white" style={{ '--s-accent': accentOf(data.draft) } as CSSProperties}><Logo doc={data.draft} /></span>
          <div className="min-w-0">
            <p className="font-semibold">{nameOf(data.draft)}<span className="ml-1.5 rounded-md border px-1.5 align-[2px] text-xs font-medium text-muted-foreground">예시</span></p>
            <p className="text-[13px] text-muted-foreground" role="status">{ed.saveMsg}</p>
          </div>
        </div>
        <Tabs value={ui.view} onValueChange={v => { ed.endTyping(); ed.patchUi({ view: v as View }); window.scrollTo({ top: 0 }); }}>
          <TabsList aria-label="화면 선택" className="h-12 rounded-xl p-1">
            <TabsTrigger value="edit" className="h-10 px-4 text-base">페이지 편집</TabsTrigger>
            <TabsTrigger value="content" className="h-10 px-4 text-base">콘텐츠 관리</TabsTrigger>
            <TabsTrigger value="live" className="h-10 px-4 text-base">공개 사이트 보기</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          {ui.view !== 'content' && (
            <ToggleGroup type="single" variant="outline" value={ui.device} aria-label="미리보기 크기" onValueChange={v => v && ed.patchUi({ device: v as Device })}>
              <ToggleGroupItem value="pc" className="h-11 px-4 text-base font-semibold">PC</ToggleGroupItem>
              <ToggleGroupItem value="mobile" className="h-11 px-4 text-base font-semibold">휴대폰</ToggleGroupItem>
            </ToggleGroup>
          )}
          {ed.dirty && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2.5 rounded-full bg-ring" />발행 안 된 변경 있음</span>}
          <Button onClick={ed.publish} disabled={!ed.dirty}>{ed.dirty ? '발행하기' : '발행됨'}</Button>
        </div>
      </div>
    </header>
  );
}
