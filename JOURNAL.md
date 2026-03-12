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
