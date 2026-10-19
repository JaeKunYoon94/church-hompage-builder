export type BlockType = 'hero' | 'worship' | 'sermons' | 'bulletin' | 'notices' | 'about' | 'staff' | 'pastor' | 'gallery' | 'map' | 'text' | 'form';
export type Props = Record<string, string>;

export interface Block { id: string; type: BlockType; hidden: boolean; props: Props }
export interface Place { addr: string; transit: string; parking: string; phone: string }
export interface Privacy { officer: string; contact: string; effective: string }

/** A site document: what 발행 copies from draft to published. */
export interface Doc {
  name?: string;
  color?: string;
  logo?: string;
  worship?: string[][];
  privacy?: Partial<Privacy>;
  place?: Partial<Place>;
  /** look of the church site; empty = the default one */
  design?: 'warm' | 'navy';
  blocks: Block[];
}

export interface Banner { title: string; sub: string; btn: string; btnTo: string; btn2: string; btn2To: string; align: 'left' | 'center'; dim: 'low' | 'mid' | 'high'; image: string }
export interface Sermon { title: string; verse: string; preacher: string; date: string; url?: string; vid?: string }
export interface Bulletin { title: string; date: string; file: string; pages?: string[]; pageCount?: number }
export interface Notice { title: string; date: string; body: string }
export interface Person { name: string; role: string }
export interface GalleryItem { image: string; title: string }

/** Content lists live apart from the blocks: saving one shows on the site at once, no 발행 needed. */
export interface Lists {
  sermons: Sermon[];
  bulletins: Bulletin[];
  notices: Notice[];
  staff: Person[];
  banners: Banner[];
  gallery: GalleryItem[];
}
export type ListKey = keyof Lists;

export interface AppData extends Lists { draft: Doc; published: Doc; prev: Doc | null }

export type View = 'edit' | 'content' | 'live';
export type Device = 'pc' | 'mobile';
export type CTab = 'banner' | 'sermons' | 'bulletins' | 'notices' | 'staff' | 'gallery';
export type DocKind = 'privacy' | 'terms';
