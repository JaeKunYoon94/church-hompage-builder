import { CTAB_LABEL } from '@/constants';
import { cn } from '@/lib/utils';
import { useEd } from '@/store';
import type { CTab, ListKey } from '@/types';
import { BannerPanel } from './content/BannerPanel';
import { BulletinsPanel, GalleryPanel, NoticesPanel, StaffPanel } from './content/ListPanels';
import { SermonsPanel } from './content/SermonsPanel';

const ORDER: CTab[] = ['banner', 'sermons', 'bulletins', 'notices', 'staff', 'gallery'];

/** 콘텐츠 관리: lists that feed the auto blocks. Every panel stays mounted (hidden) so half-typed forms survive a tab switch. */
export function ContentView() {
  const ed = useEd(), tab = ed.ui.ctab;
  const show = (t: CTab) => ({ hidden: t !== tab });
  return (
    <section>
      <div className="mb-4">
        <h1 className="mb-1 text-[22px] font-semibold">콘텐츠 관리</h1>
        <p className="text-muted-foreground">여기 올린 내용은 홈페이지의 해당 블록에 바로 반영됩니다. 발행하지 않아도 됩니다.</p>
      </div>
      <div className="grid items-start gap-4 min-[721px]:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="콘텐츠 종류" className="grid gap-1 rounded-xl border bg-card p-2 max-[720px]:flex max-[720px]:overflow-x-auto min-[721px]:sticky min-[721px]:top-[76px]">
          {ORDER.map(t => (
            <button key={t} type="button" aria-current={t === tab ? 'page' : undefined} onClick={() => ed.patchUi({ ctab: t })}
              className={cn('flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left font-semibold hover:bg-muted max-[720px]:shrink-0', t === tab && 'bg-accent text-accent-foreground')}>
              {CTAB_LABEL[t]}
              {t !== 'banner' && <span className="text-[13px] font-normal text-muted-foreground tabular-nums">{ed.data[(t as ListKey)].length}</span>}
            </button>
          ))}
        </nav>
        <div className="max-w-[720px] min-w-0">
          <div {...show('banner')}><BannerPanel active={tab === 'banner'} /></div>
          <div {...show('sermons')}><SermonsPanel /></div>
          <div {...show('bulletins')}><BulletinsPanel /></div>
          <div {...show('notices')}><NoticesPanel /></div>
          <div {...show('staff')}><StaffPanel /></div>
          <div {...show('gallery')}><GalleryPanel /></div>
        </div>
      </div>
    </section>
  );
}
