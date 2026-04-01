# MCP-First Migration Blueprint

## Objective
Migrate the current terminal backend to an MCP-first architecture without preserving backward compatibility, since the software is not yet in production.

This blueprint minimizes moving parts, removes legacy adapters, and makes ChatGPT tool-calling the primary integration model.

## Why MCP-First is Better in This Stage
- One canonical interface for operations (tool calls), not command-string parsing.
- Less translation logic and fewer drift risks.
- Faster evolution to natural-language orchestration.
- Cleaner testability with typed contracts.
- Better long-term interoperability with AI clients.

## Target Architecture

### Core principles
- Domain operations are pure and deterministic.
- MCP tools are thin wrappers over domain operations.
- Safety controls remain in domain layer (confirm/cancel/TTL/context lock).
- UI can call domain API directly or through MCP gateway depending on deployment choice.

## Target Folder Tree

```text
server/src/
  index.js
  app.js
  config/
    constants.js
  domain/
    releaseOperations.js
    mutationOperations.js
    confirmationService.js
    contextValidation.js
    errors.js
  services/
    apsClient.js
  mcp/
    server.js
    toolRegistry.js
    tools/
      releaseListTool.js
      releaseUseTool.js
      releaseTagTool.js
      releaseSetDefaultTool.js
      confirmTool.js
      cancelTool.js
    schemas/
      sharedSchemas.js
      toolSchemas.js
  routes/
    healthRoutes.js
  tests/
    domain/
    mcp/
```

## Module Responsibilities

### domain/releaseOperations.js
- listReleases(context, accessToken)
- useRelease(context, releaseId, accessToken)
- Resolves product, validates same-product constraints.

### domain/mutationOperations.js
- requestReleaseTag(context, targetState)
- requestSetDefault(context)
- confirmOperation(token, accessToken)
- cancelOperation(token)
- Delegates persistent pending state to confirmationService.

### domain/confirmationService.js
- In-memory queue with TTL.
- createPending, getPending, deletePending, cleanupExpired.

### domain/contextValidation.js
- Validate accessType, accessId, currentReleaseId.
- Context lock checks and guardrails for mutating operations.

### domain/errors.js
- Typed domain errors with stable code mapping.
- Example: auth_missing, invalid_context, confirmation_expired, mutation_failed.

### services/apsClient.js
- APS read/mutation integration only.
- No command parsing, no policy logic.

### mcp/toolRegistry.js
- Registers tools and binds schemas + handlers.

### mcp/tools/*
- Very thin wrappers calling domain operations.
- Return standardized response shape:
  - status: ok | error | confirmation_required
  - output: string
  - data: object

### mcp/schemas/*
- Single source of truth for input/output contracts.

## Tool Contract Set

- release_list
  - input: context
  - output: productId + releases[]

- release_use
  - input: context + releaseId
  - output: releaseSelection + productId

- release_tag
  - input: context + targetState(ACTIVE|OBSOLETE)
  - output: confirmation_required token on first call; mutation result on confirm

- release_set_default
  - input: context
  - output: confirmation_required token on first call; mutation result on confirm

- confirm_pending
  - input: confirmationToken + context(optional for audit)
  - output: execution result

- cancel_pending
  - input: confirmationToken
  - output: cancellation status

## Migration Sequence

### Step 1: Extract domain operations
- Move command switch logic out of terminal executor into domain modules.
- Keep current behavior exactly the same.

### Step 2: Introduce stable domain contracts
- Add shared input/output types and error mapping.
- Update tests to target domain modules first.

### Step 3: Add MCP tool registry and handlers
- Implement mcp/toolRegistry and mcp/tools.
- Each tool calls one domain operation.

### Step 4: Remove command parser dependency
- Deprecate commandParser as primary interface.
- Keep terminal UX parser on frontend only if needed for user convenience.

### Step 5: Switch UI integration strategy
Choose one:
1. Direct MCP call path from backend-facing UI integration layer.
2. Keep a simple typed backend route that internally calls the same domain ops as MCP.

Since backward compatibility is not required, prefer direct typed calls or MCP-only wiring.

### Step 6: Harden and validate
- Expand tests for confirm/cancel expiry and mutation failures.
- Add contract tests for each MCP tool.
- Add negative tests for invalid context and permission-denied APS responses.

## Test Plan

### Unit tests
- domain/releaseOperations
- domain/mutationOperations
- domain/confirmationService
- mcp/tools handlers

### Contract tests
- Tool input validation
- Tool output shape consistency
- Error code mapping

### Integration tests
- Full flow: request mutation -> confirm -> APS mutation -> success
- Full flow: request mutation -> cancel -> no execution
- Expired confirmation token behavior

## Recommended Deletions After Cutover
- Remove server-side strict command parser endpoint as canonical execution path.
- Remove parser-oriented backend tests once domain+MCP tests fully cover behavior.

## Risk Controls During Migration
- Keep domain behavior parity tests while moving modules.
- Introduce feature flags for MCP route exposure if needed.
- Enforce context lock and confirm-required rules in domain, not in transport layer.

## Deliverables Checklist
- Domain modules extracted and tested.
- MCP tool registry + tool handlers implemented.
- Shared schemas and stable error codes implemented.
- UI updated to typed/MCP-driven operation calls.
- Legacy parser path removed or downgraded to optional convenience layer.

## Suggested Implementation Order in This Repository
1. Add domain folder and move operation logic.
2. Add mcp folder with schemas + tool handlers.
3. Add mcp/server wiring in app bootstrap.
4. Add tests for domain and mcp layers.
5. Update terminal UI integration.
6. Remove legacy parser coupling from backend flow.

## Actionable File-by-File Checklist

Use this section as the implementation plan of record.

### Phase A: Domain extraction (from current executor)

#### A1. Create domain modules
- Add `server/src/domain/releaseOperations.js`
  - Implement `listReleases(context, accessToken, deps)`
  - Implement `useRelease(context, releaseId, accessToken, deps)`
  - Move behavior currently inside `release_list` and `release_use` branches from `server/src/terminal/executor.js`

- Add `server/src/domain/mutationOperations.js`
  - Implement `requestReleaseTag(context, targetState, confirmationService)`
  - Implement `requestSetDefault(context, confirmationService)`
  - Implement `confirmOperation(token, accessToken, deps, confirmationService)`
  - Implement `cancelOperation(token, confirmationService)`
  - Move behavior currently in `confirm`, `cancel`, `release_tag`, and `release_set_default` branches from `server/src/terminal/executor.js`

- Add `server/src/domain/contextValidation.js`
  - Move context checks from `server/src/terminal/commandParser.js`
  - Export reusable validators for tool handlers

- Add `server/src/domain/errors.js`
  - Define centralized error factories and stable codes
  - Map current route responses (`auth_missing`, `invalid_command`, `invalid_context`, `server_error`)

- Add `server/src/domain/confirmationService.js`
  - Wrap and replace `server/src/utils/confirmationStore.js` usage as domain-level primitive
  - Keep TTL behavior unchanged

#### A2. Refactor executor to orchestrate domain modules only
- Edit `server/src/terminal/executor.js`
  - Remove direct APS orchestration branches
  - Delegate to `domain/releaseOperations` and `domain/mutationOperations`
  - Keep current output shape unchanged during this phase

#### A3. Acceptance criteria
- No behavioral change in existing command flows
- Existing tests still pass

### Phase B: MCP tool layer (new canonical interface)

#### B1. Add schemas
- Add `server/src/mcp/schemas/sharedSchemas.js`
  - Context schema
  - Standard response schema

- Add `server/src/mcp/schemas/toolSchemas.js`
  - Input and output schemas per tool

#### B2. Add MCP tools
- Add `server/src/mcp/tools/releaseListTool.js`
- Add `server/src/mcp/tools/releaseUseTool.js`
- Add `server/src/mcp/tools/releaseTagTool.js`
- Add `server/src/mcp/tools/releaseSetDefaultTool.js`
- Add `server/src/mcp/tools/confirmTool.js`
- Add `server/src/mcp/tools/cancelTool.js`

Each tool should:
- Validate input against schema
- Call one domain operation
- Return standard `{ status, output, data }`

#### B3. Add tool registry and MCP server wiring
- Add `server/src/mcp/toolRegistry.js`
  - Register all tools and schemas in one place

- Add `server/src/mcp/server.js`
  - Initialize MCP server and bind tool registry

#### B4. Acceptance criteria
- All target tools are discoverable and invocable
- Tool outputs match schema and domain semantics

### Phase C: Transport wiring and cutover

#### C1. App bootstrap
- Edit `server/src/app.js`
  - Mount MCP transport/wiring
  - Keep health route from `server/src/routes/healthRoutes.js`

#### C2. Remove parser-first coupling
- De-scope `server/src/terminal/commandParser.js` from backend execution path
- Keep it only if the frontend terminal still needs local command parsing

#### C3. Optional route cleanup
- If full MCP transport is adopted, retire `server/src/routes/terminalRoutes.js`
- Otherwise keep a thin typed route that delegates to domain operations (no command switch)

#### C4. Acceptance criteria
- Backend canonical path is MCP tools, not command parser
- Mutating operations still require explicit confirm/cancel

### Phase D: Test migration and hardening

#### D1. Add domain tests
- Add `server/src/tests/domain/releaseOperations.test.js`
- Add `server/src/tests/domain/mutationOperations.test.js`
- Add `server/src/tests/domain/contextValidation.test.js`
- Add `server/src/tests/domain/confirmationService.test.js`

#### D2. Add MCP tests
- Add `server/src/tests/mcp/toolRegistry.test.js`
- Add `server/src/tests/mcp/tools.test.js`
- Validate schema, success cases, and negative cases

#### D3. Keep and then reduce legacy tests
- Keep `server/src/terminal/*.test.js` during transition
- Remove parser-oriented tests after MCP path is fully canonical

#### D4. Acceptance criteria
- All test suites pass with `npm run test`
- Coverage exists for confirm/cancel expiry and mutation failures

### Phase E: Frontend alignment

#### E1. Update terminal service integration
- Edit `frontend/src/services/terminalService.ts`
  - Move away from raw command endpoint assumptions
  - Integrate with typed action calls or MCP gateway payloads

#### E2. Update drawer behavior if needed
- Edit `frontend/src/components/TerminalDrawer/index.tsx`
  - Keep same UX
  - Adjust request payload shape only

#### E3. Acceptance criteria
- Drawer still supports current user flows
- No UX regression in confirm/cancel safety

## Execution Order With Current Files

1. `server/src/domain/*` (new)
2. `server/src/terminal/executor.js` (delegate to domain)
3. `server/src/mcp/schemas/*` (new)
4. `server/src/mcp/tools/*` (new)
5. `server/src/mcp/toolRegistry.js` and `server/src/mcp/server.js` (new)
6. `server/src/app.js` (wire MCP)
7. `server/src/routes/terminalRoutes.js` and `server/src/terminal/commandParser.js` (deprecate/remove from canonical flow)
8. `server/src/tests/domain/*` and `server/src/tests/mcp/*` (new)
9. `frontend/src/services/terminalService.ts` and `frontend/src/components/TerminalDrawer/index.tsx` (transport alignment)

## Definition of Done
- MCP tools are the only canonical backend execution path.
- Domain modules own all safety and business logic.
- Confirm/cancel/TTL behavior is unchanged and fully covered by tests.
- Terminal UI works against the new canonical path.
- Legacy parser-first backend flow is removed or no longer used.
