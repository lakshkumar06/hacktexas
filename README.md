# AgentLab

A playful, browser-only workshop for building AI agents. Describe an idea, watch a little team of illustrated machines assemble, then edit and run the resulting graph.

## Run locally

Requires Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`.

```sh
npm test          # Planner, execution, store, and rendered DOM journey tests
npm run build    # TypeScript check and production build
npm run preview  # Serve the production build
npm run test:e2e  # Browser journeys; requires installed Google Chrome
```

## Try it

1. Enter a vague goal, or choose a suggestion, and select **Build my agent**.
2. Click a machine to inspect it. Name and instruction edits apply when you leave the field.
3. Add parts from the shelf. Drag machines to move them; join a right socket to a left socket to connect them. Settings also include a keyboard-friendly connection selector.
4. Remove a cable in the inspector, or select it and press Delete. Undo and redo restore graph edits and settings.
5. Run the simulation. Only connected machines participate; Memory supplies context to Brain. Cycles, missing output paths, and unconnected demo inboxes receive actionable feedback.
6. Save and reopen using **My agents**. Existing unsaved work is saved locally before opening another agent or generating a replacement. Storage failures preserve the current workbench.

Shortcuts: ⌘/Ctrl Z to undo, ⌘/Ctrl Shift Z to redo, ⌘/Ctrl S to save, and ⌘/Ctrl Enter to build from the prompt.

## Simulation boundaries

Everything is a frontend simulation. There is no backend, database server, real AI, live web search, or Google authentication. Sample organizations, opportunities, and inbox messages are fictional. Gmail authorization only enables a local demo flag. No credentials are requested or stored.

The typed planner recognizes research, sponsorship, internship, inbox, and general goals. Execution follows the current graph and instructions. Since no model is used, freeform instructions are not interpreted generally: supported mock modifiers include **one**, **short**, **detailed**, and **numbered**. Gmail also supports **only urgent** and **only newsletters**. Each result exposes the exact settings used for its run.

Saved agents use versioned `localStorage` on the current browser and origin. They are not synchronized across devices. Clearing site data removes them.

## Stack and structure

React · TypeScript · Vite · React Flow · Motion · Zustand. Reusable SVG primitives create the entire machine family. Fonts are bundled locally.

See [architecture](docs/ARCHITECTURE.md) and [implementation progress](docs/PROGRESS.md).

Visual reference: [Colorfigures by April Zhu](https://april-zhu.com/colorfigures). No SimLab screenshot was included in the supplied task context.

## Verification status

Production build, dependency audit, and 21 automated tests pass. Tests include a rendered DOM journey through create, planning, settings, run, save/reopen, connection edits, undo/redo, and simulated Gmail authorization.

Browser screenshot inspection and the Playwright suite remain unverified: the browser tool's saved-permission policy blocked local preview access. The prepared browser suite covers actual dragging, socket connections, mobile layout, reduced motion, and screenshots. DOM tests do not verify visual layout or pointer geometry.
