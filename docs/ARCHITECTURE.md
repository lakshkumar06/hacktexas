# AgentLab architecture

Browser-only React + TypeScript + Vite. No network AI calls or real authorization.

- `lib/model.ts`: typed graph, shared component catalog, deterministic planner.
- `lib/execution.ts`: validate and topologically execute the editable graph; deterministic sample results.
- `lib/store.ts`: Zustand graph state, bounded undo/redo, versioned browser-local saves.
- `components/Machine.tsx`: shared SVG drawing primitives and seven machine variants.
- `components/Graph.tsx`: React Flow adapter, illustrated nodes, socket validation, illuminated cables.
- `App.tsx`: create, planning, workshop, inspector, simulated authorization, saved agents.
- `styles.css`: shared paper/ink palette, tactile controls, responsive layouts, reduced motion.

Execution uses a graph snapshot and locks graph editing during the run. Only nodes reachable from Task run; Memory is a connected context source. Cycles and unreachable Output block execution with actionable feedback. Authorization is a local preview flag. Saves store graph/configuration, never run state or credentials.

Graph changes have bounded history (40 snapshots), including Task goal edits and keyboard movement. Inspector fields commit on blur. Replacing a dirty graph first saves its configuration and aborts if storage fails. Output traces include only contributing ancestors. Results expose the instruction snapshot and support deterministic wording modifiers. Fonts are self-hosted through Fontsource packages.

Validation is split into unit/state tests, jsdom-rendered interaction tests, and a separately prepared Playwright suite. Browser-based layout checks remain blocked by the local preview permission gate.
