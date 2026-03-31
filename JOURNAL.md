# JOURNAL

This file tracks the implementation history of this app. We will append new entries over time.

## 2026-03-10

### Project foundation
- Set up monorepo structure with `frontend` (React + TypeScript + Vite + MUI) and `backend` (Node/Express + APS auth integration).
- Wired frontend/backend auth flow, including login, callback, token refresh, profile, and avatar endpoints.
- Added build/typecheck/health verification via `npm run build:verify`.

### Core UX and layout
- Improved responsive behavior for header and main app viewport resizing.
- Updated theme primary color to black.
- Updated button style to capitalized text.
- Added settings and release dialogs integration with header account menu.

### Open Release dialog evolution
- Refactored Open Release dialog UI for a simplified flow.
- Added `AccessType` selection and ACC-specific Hub/Project selection field.
- Replaced plain menu with searchable popover menu.
- Added API-backed Hub/Project loading from BIM 360 clients endpoint.
- Added progressive loading UX:
  - loading spinner while fetching
  - error message area for failed fetches
  - empty-state message when no results

### Hub/Project menu enhancements
- Enabled pagination for Hub/Project API loading (multi-page fetch until complete).
- Added two-line item rendering:
  - line 1: project/client `name`
  - line 2: `accountName` (smaller typography)
- Added left icon using `imageUrl`.
- Added right-side platform chip (uppercase).
- Added region flag display to the right of platform chip.
- Added sorting by project name.
- Improved key stability to avoid duplicate key warnings in React rendering.

### Popover behavior fixes
- Fixed selection flow so selecting a project closes the popover.
- Added robust outside-click close behavior for Hub/Project popover.
- Simplified open behavior to avoid requiring a second click.
- Tuned popup spacing by reducing side padding.

### ACC folder panel (new row under form)
- Added ACC-only second row under the form with two panels:
  - left: folder navigation panel
  - right: IND project panel
- Added service integration for:
  - top folders endpoint (`project/v1/.../topFolders`)
  - folder contents endpoint (`data/v1/.../folders/{id}/contents`)
- Implemented lazy-load strategy:
  - load top folders when project is selected
  - load folder contents on folder select/expand
- Added diagnostics/validation for invalid hub/project identifiers and API failures.

### Header account menu improvements
- Added user info card at top of right-side account menu.
- Shows avatar + full name + email (small typography under name).
- Extended backend profile response to include email.
- Added user-info enrichment by querying:
  - `https://api.userprofile.autodesk.com/userinfo`
- Refreshes profile when opening account menu to surface latest email data.

### External libraries and resources

#### Frontend libraries
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Vite: https://vitejs.dev/
- MUI (Material UI): https://mui.com/
- MUI Icons: https://mui.com/material-ui/material-icons/
- i18next (React): https://react.i18next.com/

#### Backend libraries
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- APS SDK (`@aps_sdk` packages):
  - Authentication: https://www.npmjs.com/package/@aps_sdk/authentication
  - SDK Manager: https://www.npmjs.com/package/@aps_sdk/autodesk-sdkmanager

#### Autodesk Platform Services (APS) resources
- APS overview: https://aps.autodesk.com/
- Authentication concepts: https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/
- User info endpoint: https://api.userprofile.autodesk.com/userinfo
- Project top folders endpoint pattern:
  - `https://developer.api.autodesk.com/project/v1/hubs/{hubId}/projects/{projectId}/topFolders`
- Folder contents endpoint pattern:
  - `https://developer.api.autodesk.com/data/v1/projects/{projectId}/folders/{folderId}/contents`
- BIM 360 admin clients endpoint:
  - `https://developer.api.autodesk.com/bim360/admin/ui/v1/clients`

#### Tooling and quality checks
- Monorepo verification command:
  - `npm run build:verify`
- Frontend build command:
  - `npm --prefix frontend run build`
- Backend typecheck command:
  - `npm --prefix backend run typecheck`

---

## Notes for next entries
- Add a new dated section for each future change set.
- Prefer short bullets with:
  - what changed
  - why it changed
  - any API/UI behavior implications

---

## 2026-03-11

### Auth architecture migration (PKCE, frontend-only)
- Replaced backend-dependent auth service usage with SPA PKCE flow in frontend.
- Implemented OAuth code exchange, refresh-token flow, token/profile local storage, and callback cleanup in `frontend/src/services/authService.ts`.
- Updated avatar handling to use profile picture from OAuth user info payload (no backend avatar endpoint dependency).

### Backend decommissioning
- Removed backend application from the workspace and converted root scripts to frontend-only workflows.
- Removed backend health-check script and backend-specific debug capture references.
- Removed Vite `/api` proxy and deleted obsolete API base config utility used for backend URL composition.
- Updated README and env templates to document frontend-only setup.

### Frontend runtime configuration
- Added environment-driven dev server port support in Vite config.
- Introduced `VITE_DEV_SERVER_PORT` and set default/example usage to `8080`.
- Aligned redirect URI examples to `http://localhost:8080/`.

### Test and coverage improvements
- Added `@vitest/coverage-v8@3.2.4` for coverage reporting compatible with current Vitest version.
- Added npm script `test:coverage:ts` in `frontend/package.json` to measure TypeScript-only coverage:
  - include: `src/**/*.ts`
  - exclude: `src/**/*.tsx`, `src/**/*.d.ts`
- Expanded unit tests across hooks/services/stores to significantly improve `.ts` line coverage.
- Latest measured TS-only coverage (excluding `.tsx` and `.d.ts`):
  - statements/lines: `98.16%`
  - functions: `98.76%`
  - branches: `84.04%`

### Linting and developer workflow
- Added and tuned ESLint flat configuration for TypeScript + React hooks + test files.
- Added root lint scripts to delegate frontend linting.
- Kept existing warnings visible while maintaining zero lint errors.

### Zustand state-management migration
- Migrated store/hook state to Zustand for shared app behavior:
  - `viewerMessageStore`
  - `settingsStore`
  - `useAppUiState`
  - `useReleaseWorkflow`
  - `useAuthSession`
- Added/reset state helpers in tests to keep test isolation stable after shared-store adoption.

### Product Picker UX and loading behavior
- Replaced circular loading indicator with linear progress in the Hub/Project popover.
- Implemented incremental pagination rendering for BIM 360 clients:
  - introduced optional per-page callback in `getBim360Clients`
  - updated picker hook to show items as pages arrive instead of waiting for full completion
- Fixed effect lifecycle cancellation issue during incremental updates using load-guard logic.
- Moved loader to the bottom of the results list while pages continue loading.

### Search highlight and dark-theme polish
- Enhanced search-match highlight to include background emphasis in addition to bold text.
- Made highlight background theme-aware for dark mode compatibility.
- Fixed dark-mode contrast issues for focused Access Type input label/outline.
- Updated Cancel actions to outlined buttons and normalized action button dimensions so Cancel and primary actions have matching visual size in dialogs.

---

## 2026-03-12

### Open Release dialog behavior and data flow
- Stabilized release selection/open behavior so selected release data is persisted and used consistently on submit.
- Refined URL update and reload behavior for release opening flow.
- Added `Release Details` panel with release metadata and thumbnail rendering support.

### Informed Design integration updates
- Added and wired PUBLIC publishers data flow and source panel.
- Implemented thumbnail object-key resolution using product download URL endpoint.
- Expanded product/release payload parsing to support richer metadata fields.

### USER mode iteration and rollback
- Implemented USER-mode users loading by selected hub account using HQ users API.
- Added fallback to current authenticated user when users API fails.
- Added temporary debug logging for user/auth payload inspection, then removed all debug logs.
- Removed USER access type and all USER-only UI/state/data paths per product direction.

### Auth profile mapping
- Updated user profile mapping so `userId` is sourced from `/userinfo` `eidm_guid` (fallback to `sub`).
- Updated auth service tests to match new profile shape including `userId`.

### Test/lint quality and repo setup
- Fixed failing frontend tests and restored green test suite (`23` files, `86` tests passing).
- Reviewed ESLint status; left only existing non-blocking warning in `App.tsx`.
- Hardened root `.gitignore` for monorepo defaults and refined env ignore patterns.

### Git/GitHub initialization and branch management
- Initialized git repository and created initial commit.
- Added remote origin and pushed repository to GitHub.
- Renamed local branch to `main`, pushed and tracked `origin/main`.
- Synced local remote refs after default-branch switch and remote `master` cleanup.

---

## 2026-03-31

### Informed Design terminal feature rollout (Phases 1 and 2)
- Implemented a modal side-drawer terminal in the frontend and integrated it with current release context/state.
- Added strict command workflow in UI and backend:
  - `help`, `clear`, `release list`, `release use <releaseId>`, `release tag active`, `release tag obsolete`, `release set-default`, `confirm`, `cancel`
- Wired terminal-driven release switching into existing release workflow (`submitSpecificReleaseData`) so viewer context updates from command execution.

### Backend re-introduction for command orchestration
- Reintroduced a lightweight backend (`server/`) in the same repository to host terminal command execution endpoints.
- Added runtime scripts at root for backend and combined startup:
  - `dev:be`, `dev`
- Added Vite proxy for `/api` in frontend dev mode to route terminal requests to backend.

### APS command execution and mutation behavior
- Implemented read operations for release listing and release context validation/switching.
- Implemented confirm-gated mutating operations for release tagging and default release assignment.
- Added confirmation token lifecycle controls (in-memory queue + TTL expiration) to reduce accidental destructive actions.
- Implemented APS mutation fallback attempts across multiple payload/endpoint shapes for compatibility with API variants.

### Server architecture refactor by responsibility
- Refactored monolithic backend file into a structured module tree:
  - `config` for constants
  - `routes` for HTTP entrypoints
  - `terminal` for parsing/help/execution orchestration
  - `services` for APS HTTP integration
  - `utils` for encoding and confirmation store behavior
- Kept public API behavior unchanged while improving maintainability and testability.

### Unit testing expansion (backend)
- Added backend unit tests using Node's built-in test runner for:
  - command parsing and context validation
  - confirmation store lifecycle (save/get/delete/expire)
  - terminal executor orchestration paths (help/list/confirm/cancel)
  - help payload coverage
- Added root script `test:be` and updated `test` to run both frontend and backend tests.

### Quality checks and source control
- Verified green status for build, lint, and tests after each major step.
- Committed and pushed all changes to `main`.
- Push reference:
  - commit `ba00710`
  - `origin/main`
