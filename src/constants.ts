import { SAMPLE } from './lib/sampleImages';
import type { Banner, BlockType, CTab, Props } from './types';

export interface BlockSpec { name: string; desc: string; auto: string; props: Props }

export const TYPES: Record<BlockType, BlockSpec> = {
  hero:     { name: '대표 배너', desc: '교회 사진과 표어', auto: '대표 배너', props: {} },
  worship:  { name: '예배 안내', desc: '예배 시간과 장소', auto: '사이트 설정', props: { title: '예배 안내', bg: 'soft' } },
  sermons:  { name: '최근 설교', desc: '설교 영상과 목록', auto: '설교', props: { title: '최근 설교', count: '3', bg: 'white' } },
  bulletin: { name: '주보', desc: '이번 주 주보', auto: '주보', props: { title: '이번 주 주보', bg: 'soft' } },
  notices:  { name: '공지사항', desc: '최근 공지', auto: '공지', props: { title: '공지사항', count: '3', bg: 'white' } },
  about:    { name: '교회 소개', desc: '비전과 연혁', auto: '', props: { title: '교회 소개', body: '새빛교회는 열두 가정이 모여 시작한 교회입니다.\n말씀과 기도, 이웃 섬김을 중심에 두고 지역과 함께 걸어갑니다.', bg: 'white', photo: SAMPLE.about } },
  staff:    { name: '섬기는 분들', desc: '목회자·교역자', auto: '섬기는 분들', props: { title: '섬기는 분들', bg: 'soft' } },
  pastor:   { name: '목회자 소개', desc: '사진과 인사말', auto: '', props: { title: '목회자 소개', name: '김○○', role: '담임목사', body: '안녕하세요, 새빛교회 담임목사입니다.\n처음 오신 분도 편안하게 예배드리실 수 있도록 정성껏 맞이하겠습니다.', bg: 'white', photo: SAMPLE.pastor } },
  gallery:  { name: '갤러리', desc: '교회 행사·예배 사진', auto: '갤러리', props: { title: '갤러리', bg: 'soft' } },
  map:      { name: '오시는 길', desc: '지도 앱 바로가기, 주차 안내', auto: '사이트 설정', props: { title: '오시는 길', bg: 'white' } },
  text:     { name: '글·사진', desc: '자유 문단', auto: '', props: { title: '제목을 입력하세요', body: '내용을 입력하세요.', bg: 'white' } },
  form:     { name: '문의·새가족 등록', desc: '동의 체크 자동 포함', auto: '', props: { title: '새가족 등록', body: '연락처를 남겨 주시면 담당 교역자가 연락드립니다.', bg: 'soft' } }
};
export const SHELF: BlockType[] = ['hero', 'worship', 'sermons', 'bulletin', 'notices', 'about', 'pastor', 'staff', 'gallery', 'map', 'text', 'form'];
export const isBlockType = (t: string): t is BlockType => t in TYPES;

export const GALLERY_MAX = 12; // ponytail: photos live in localStorage as data URLs; a server/storage replaces this cap
export const LABEL: Record<string, string> = { title: '제목', sub: '부제', btn: '버튼 문구', name: '이름', role: '직분', body: '내용', count: '보여줄 개수', bg: '배경' };
export const BG: Record<string, string> = { white: '흰색', soft: '연한 색', accent: '대표 색상' };
export const COLORS: Record<string, { name: string; v: string }> = { sky: { name: '하늘', v: '#2563eb' }, navy: { name: '남색', v: '#24407a' }, green: { name: '초록', v: '#2e6a42' }, wood: { name: '우드', v: '#7a5c3e' }, plum: { name: '자주', v: '#6a2f5b' } };
export const CHURCH = { name: '새빛교회', addr: '서울특별시 중구 세종대로 110', phone: '02-000-0000', transit: '○○역 2번 출구에서 걸어서 10분', parking: '교회 앞 20대, 주일에는 옆 학교 운동장 이용' };
export const WORSHIP: string[][] = [['주일 1부 예배', '오전 9:00', '본당'], ['주일 2부 예배', '오전 11:00', '본당'], ['수요 예배', '오후 7:30', '소예배실'], ['새벽 기도회', '오전 5:30 (화~토)', '소예배실']];
export const STAFF: [string, string][] = [['김○○', '담임목사'], ['이○○', '부목사'], ['박○○', '교육전도사'], ['최○○', '찬양 인도']];
/** block "auto" label → the content tab that feeds it */
export const CTAB: Record<string, CTab> = { '대표 배너': 'banner', '설교': 'sermons', '주보': 'bulletins', '공지': 'notices', '섬기는 분들': 'staff', '갤러리': 'gallery' };
export const CTAB_LABEL: Record<CTab, string> = { banner: '대표 배너', sermons: '설교', bulletins: '주보', notices: '공지사항', staff: '섬기는 분들', gallery: '갤러리' };
export const DEFAULT_BANNER: Banner = { title: '빛과 소금이 되는 교회', sub: '처음 오신 분도 편안하게 함께 예배드립니다', btn: '예배 시간 보기', btnTo: 'worship', btn2: '', btn2To: '', align: 'left', dim: 'mid', image: '' };
export const BTN_TO: Record<string, string> = { worship: '예배 안내로 이동', map: '오시는 길로 이동', form: '새가족 등록으로 이동', sermons: '최근 설교로 이동', '': '연결 안 함' }; // keys are block types
export const DIM = { low: .25, mid: .42, high: .6 };
/** phone tab bar (bottom of the page): block type → label; only blocks on the page show, first four win */
export const TABS: [BlockType, string][] = [['worship', '예배'], ['notices', '소식'], ['bulletin', '주보'], ['sermons', '설교']];
export const KEY = 'church-builder-proto-v1';
export const STARTER_BLOCKS: BlockType[] = ['hero', 'worship', 'sermons', 'bulletin', 'notices', 'about', 'staff', 'map', 'form'];
