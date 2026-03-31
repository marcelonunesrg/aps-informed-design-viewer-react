# ChatGPT Terminal Integration Strategy

## Overview
This document captures the agreed strategy to embed a ChatGPT-powered terminal in the current APS Informed Design Viewer application and enable command-driven operations on the currently open release.

The strategy was designed in phases to reduce risk and allow progressive delivery:

- Phase 1: strict command terminal and backend orchestration scaffold
- Phase 2: real backend execution for mutating operations with confirmation safeguards
- Next phase: ChatGPT intent layer over strict tools

## Goals
- Provide a terminal-like UX inside the app as a modal side drawer.
- Allow users to run release-oriented operations using command input.
- Keep operations scoped to the currently open release/product context.
- Protect mutating operations with explicit confirmation.
- Maintain security boundaries by executing backend operations server-side.

## Non-goals (for current implementation)
- Free-form natural language execution without guardrails.
- Direct LLM access to APS APIs from the browser.
- Role-based access control custom logic in app layer (delegated to APS/API permissions for now).

## Product Decisions (agreed)
1. Add a small backend inside the same repository.
2. Start with strict terminal commands first.
3. Enable for all authenticated users and rely on APS permission controls.
4. Use a modal side drawer UX.

## High-level Architecture

### Frontend
- Modal side drawer terminal integrated into existing app shell.
- Input command box, output history, context chips, and confirmation prompt state.
- Uses existing release workflow APIs to apply release switches.
- Calls backend endpoint `/api/terminal/execute` with auth bearer token and context.

### Backend
- Lightweight Node/Express backend in this repository.
- Strict command parser and command executor.
- APS integration service to perform list/read/mutation calls.
- In-memory confirmation token store with TTL.
- Confirm/cancel flow for mutating commands.

### Security Boundaries
- Browser sends authenticated command requests only.
- Backend validates command and context before execution.
- Mutating operations require two-step confirmation.
- Confirmation tokens expire to limit stale/dangerous execution.

## Command Surface
Current strict commands:

- `help`
- `clear`
- `release list`
- `release use <releaseId>`
- `release tag active`
- `release tag obsolete`
- `release set-default`
- `confirm`
- `cancel`

## Context Contract
Each command request includes contextual scope:

- `accessType`
- `accessId`
- `currentReleaseId`
- `currentProductId` (optional, resolved server-side if missing)

This ensures commands act on the currently open operational context.

## API Contract
### Execute Command
`POST /api/terminal/execute`

Request body:
- `command: string`
- `context: { accessType, accessId, currentReleaseId, currentProductId? }`
- `confirmationToken?: string`

Response:
- `status: "ok" | "error" | "confirmation_required"`
- `output: string`
- `data?: object`
- `confirmationToken?: string`
- `code?: string`

## Operational Behavior

### Read/List operations
- Execute immediately when command is valid and context is complete.

### Mutating operations
- Step 1: return `confirmation_required` with a token and action summary.
- Step 2: only `confirm` executes the mutation.
- `cancel` invalidates the pending action.
- Expired tokens require re-running the original mutating command.

## UX Strategy
- Terminal is a right-side modal drawer.
- Header includes a direct Terminal action.
- Output history keeps user and system messages.
- Visual warning is shown whenever a mutating operation is pending confirmation.
- Release/product context is visible in drawer chips.

## Error Handling Strategy
Standardized backend error categories:

- `auth_missing`
- `invalid_command`
- `invalid_context`
- `server_error`

Terminal shows clear error text and preserves history for traceability.

## Test Strategy

### Backend unit tests
- Parser behavior and invalid inputs.
- Confirmation store save/delete/expiry lifecycle.
- Executor orchestration for help/list/confirm/cancel flows.
- Help payload coverage.

### Frontend tests
- Existing test suite remains green.
- Terminal integration validated by build/lint/tests and runtime checks.

## Rollout Plan

### Completed
- Terminal drawer added to frontend.
- Backend command orchestration added.
- Strict command flow implemented.
- Real mutation execution implemented behind confirm/cancel guardrails.
- Backend architecture refactored by responsibility.
- Backend unit tests added.

### Next Step
Add ChatGPT intent interpretation over strict tools:

1. User writes natural language intent.
2. ChatGPT maps intent to one strict command/tool call.
3. Backend executes the mapped strict command path.
4. If mapping confidence is low, ask user to clarify instead of guessing.

This preserves deterministic execution while improving usability.

## Future Improvements
- Persist audit logs for executed terminal commands.
- Add route-level backend tests (HTTP behavior and status codes).
- Add telemetry for command success/failure rates.
- Optional role gates in app layer if business rules evolve.
- Introduce command suggestions/autocomplete in terminal input.

## Summary
The chosen strategy balances safety and speed:
- strict deterministic command execution first,
- backend-controlled mutations with explicit confirmation,
- then controlled introduction of ChatGPT intent mapping.

This path allows immediate operational value while keeping production risk low.
