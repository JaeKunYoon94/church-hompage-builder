# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 필수 UI 디자인 규칙

UI를 신규 구현하거나 수정하기 전에 프로젝트 루트의 [DESIGN.md](DESIGN.md)를 읽는다.

- 모든 디자인 작업에서 해당 문서의 원칙을 준수한다.
- 작업 전 기존 프로젝트 구조, 디자인 토큰, 공통 컴포넌트를 확인한다.
- 기존 기능과 비즈니스 로직을 보존하면서 필요한 범위만 수정한다.
- AI가 자주 생성하는 획일적인 카드 레이아웃, 무분별한 그라데이션, 과도한 둥근 모서리, 의미 없는 장식과 애니메이션을 지양한다.
- 구현 후에는 가능한 환경에서 실제 렌더링 화면과 주요 인터랙션을 검수한다. 문제가 발견되면 수정하고 다시 확인한다.
- 실제로 실행하지 않은 테스트나 확인하지 않은 화면을 검증 완료로 보고하지 않는다.

## 프로젝트 개요

교회 관리자가 코드 없이 홈페이지를 만드는 빌더의 **편집기 시안(prototype)**. 제품 요구사항은 [docs/PRD.md](docs/PRD.md), 기능 요약과 시안의 한계는 [README.md](README.md). 문서와 UI 문구는 모두 한국어.

## 명령어

React + TypeScript + Vite + shadcn/ui(Tailwind CSS v4). Node.js 필요.

- `npm install` — 패키지 설치
- `npm run dev` — 개발 서버. 시작 화면(샘플 구성 선택)은 `/`, 편집기는 `/editor.html`
- `npm run build` — `tsc --noEmit` 후 `vite build` (`dist/`). 린트·테스트 설정은 없다. 타입 검사만 `npm run typecheck`
- Playwright(`@playwright/test`)와 Chromium이 개발 의존성으로 설치돼 있다. 아직 테스트 파일·설정은 없고, 빌드 후 `npx vite preview`로 띄운 화면을 스크립트로 확인하는 데 쓴다 (`npx playwright install chromium`으로 브라우저 재설치)
- `npx shadcn@latest add <컴포넌트>` — shadcn 컴포넌트 추가 (`components.json`, 별칭 `@/` = `src/`)

유튜브 정보·썸네일, 글꼴, PDF 미리보기(pdf.js, 첫 PDF 업로드 때 CDN에서 불러옴)는 인터넷 연결이 필요하다. `legacy/`는 React로 옮기기 전 단일 파일 시안이며 더 이상 고치지 않는다.

## 구조

```
index.html, editor.html   Vite 입력 (시작 화면 / 편집기). index.html은 정적 페이지로 ?blocks=…&color=… 를 붙여 편집기로 보낸다
src/main.tsx, App.tsx      진입, 3단 레이아웃(블록 관리 | 캔버스 | 인스펙터) · 콘텐츠 관리 · Ctrl+Z
src/store.ts               useEditor(): 모든 편집기 상태, EditorCtx/useEd()
src/types.ts, constants.ts 데이터 모양, 블록 종류(TYPES)·색·기본값
src/lib/util.ts            접근자(nameOf, accentOf …), 유튜브, shrink(사진 축소), sample(), loadData()(구버전 보정)
src/components/            Topbar, BlockManager, Canvas, Inspector, ContentView, ViewerDialog, Site(방문자 화면), Legal(정책 문서)
src/components/content/    콘텐츠 패널(배너·설교·주보·공지·섬기는 분들·갤러리)
src/components/ui/         shadcn 컴포넌트 (생성 코드, 시안에 맞게 버튼·입력 높이를 44px로 키움)
src/index.css              Tailwind + shadcn 토큰(편집기 팔레트)
src/site.css               교회 사이트(.site, .s-*)와 캔버스의 블록 틀(.blk, .tools) — Tailwind를 쓰지 않는 방문자용 스타일
```

- **상태:** `data`(`AppData`) 하나. `data.draft`(편집 중) / `data.published`(발행본) / `data.prev`(되돌리기용 이전 발행본)는 `{ name, color, worship, privacy, place, blocks[] }` 형태의 사이트 문서이고, 설교·주보·공지·섬기는 분들·배너·갤러리(`sermons`, `bulletins`, `notices`, `staff`, `banners`, `gallery`)는 **블록과 분리된 콘텐츠 목록**이라 draft/published와 무관하게 저장 즉시 반영된다. 블록은 `{ id, type, hidden, props }`이며 기본 props는 `TYPES[type].props`.
- **변경:** 상태는 바꾸지 않고 새 객체로 교체한다. 사이트 문서는 `ed.edit(fn, isTyping?)`(undo 스냅샷 push → 복제본 수정 → 저장), 콘텐츠 목록은 `ed.setList(key, fn)`. 같은 입력칸의 연속 타이핑은 `isTyping`으로 undo 한 단계로 묶이고, 포커스를 잃으면(`endTyping`) 끊긴다. undo/redo는 `data.draft`의 JSON 스냅샷이며, 되돌린 뒤 인스펙터는 `rev`가 바뀌어 다시 마운트된다.
- **저장:** `commit()`이 `data` 전체를 localStorage 키 `church-builder-proto-v1`에 쓴다. 데이터 모양을 바꿀 때는 `loadData()`에 구버전 호환 처리를 추가한다.
- **렌더링:** 방문자 화면은 `Site` 컴포넌트 하나가 편집 캔버스·발행본·배너 미리보기(`Hero`)에 공통으로 쓰인다. 편집 중에는 `wrapBlock`으로 블록 틀을 입히고, 편집 중 클릭이 사이트 동작(영상 재생, 주소 복사, 갤러리 확대)을 일으키지 않도록 `editable`을 확인한다. React가 이스케이프하므로 `dangerouslySetInnerHTML`은 쓰지 않는다.
- **알림·창:** 토스트는 sonner(`ed.toast(msg, 라벨?, 동작?)`), 큰 보기(주보·갤러리·정책 문서)는 shadcn Dialog(`ed.openViewer(title, node)`).
- **정책 문서:** `Legal.tsx`가 교회 정보로 개인정보처리방침·이용약관을 자동 생성한다(법률 검토 필요 문안).
- **의도적 단순화:** 코드의 `ponytail:` 주석은 시안용 지름길(예: 사진을 data URL로 localStorage 저장)이며, 실서비스에서는 서버/스토리지로 대체될 부분이다.
