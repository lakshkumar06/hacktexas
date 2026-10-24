import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import {
  cable,
  catalog,
  connectionError,
  makeNode,
  planAgent,
  type Graph,
  type Kind,
  type MachineData,
  type Plan,
} from "./model";
import {
  executionOrder,
  resultsFor,
  simulateNode,
  type Result,
} from "./execution";

export type SavedAgent = Plan & { id: string; savedAt: string; version: 1 };
type Snapshot = Graph & { goal: string };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const key = "agentlab.agents.v1";
const readSaves = (): SavedAgent[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((s): s is SavedAgent => {
      if (
        !s ||
        s.version !== 1 ||
        typeof s.id !== "string" ||
        typeof s.goal !== "string" ||
        typeof s.title !== "string" ||
        typeof s.summary !== "string" ||
        !Array.isArray(s.nodes) ||
        !Array.isArray(s.edges)
      )
        return false;
      const ids = new Set<string>();
      for (const n of s.nodes) {
        if (
          !n ||
          typeof n.id !== "string" ||
          ids.has(n.id) ||
          !n.data ||
          !Object.hasOwn(catalog, n.data.kind) ||
          typeof n.data.label !== "string" ||
          typeof n.data.instruction !== "string" ||
          !Number.isFinite(n.position?.x) ||
          !Number.isFinite(n.position?.y)
        )
          return false;
        ids.add(n.id);
      }
      return s.edges.every(
        (e: { id?: string; source?: string; target?: string }) =>
          e &&
          typeof e.id === "string" &&
          ids.has(e.source || "") &&
          ids.has(e.target || ""),
      );
    });
  } catch {
    return [];
  }
};
let runToken = 0;
type Store = Plan & {
  screen: "create" | "planning" | "workbench";
  selected: string | null;
  past: Snapshot[];
  future: Snapshot[];
  saved: SavedAgent[];
  currentId: string | null;
  dirty: boolean;
  notice: string;
  running: boolean;
  active: string | null;
  completed: string[];
  activity: string[];
  results: Result[];
  build: (goal: string) => void;
  finishPlanning: () => void;
  home: () => void;
  select: (id: string | null) => void;
  checkpoint: () => void;
  changeNodes: (changes: NodeChange[]) => void;
  changeEdges: (changes: EdgeChange[]) => void;
  add: (kind: Kind, position?: { x: number; y: number }) => void;
  connect: (source: string, target: string) => void;
  disconnect: (id: string) => void;
  remove: (id: string) => void;
  update: (id: string, data: Partial<MachineData>) => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
  open: (id: string) => void;
  deleteSave: (id: string) => void;
  run: () => Promise<void>;
  stop: () => void;
  notify: (message: string) => void;
};
const blank = {
  goal: "",
  title: "Untitled agent",
  summary: "",
  nodes: [],
  edges: [],
};
export const useLab = create<Store>((set, get) => ({
  ...blank,
  screen: "create",
  selected: null,
  past: [],
  future: [],
  saved: readSaves(),
  currentId: null,
  dirty: false,
  notice: "",
  running: false,
  active: null,
  completed: [],
  activity: [],
  results: [],
  build: (goal) => {
    const previous = get();
    if (previous.nodes.length && previous.dirty) {
      previous.save();
      if (get().dirty) return;
    }
    runToken++;
    set({
      ...planAgent(goal),
      screen: "planning",
      past: [],
      future: [],
      selected: null,
      currentId: null,
      dirty: true,
      running: false,
      active: null,
      completed: [],
      activity: [],
      results: [],
    });
  },
  finishPlanning: () => set({ screen: "workbench", selected: "brain" }),
  home: () => {
    if (get().running) return;
    set({ screen: "create", selected: null });
  },
  select: (selected) => set({ selected }),
  notify: (notice) => set({ notice }),
  checkpoint: () => {
    const s = get();
    if (!s.running)
      set({
        past: [
          ...s.past.slice(-39),
          clone({ nodes: s.nodes, edges: s.edges, goal: s.goal }),
        ],
        future: [],
        dirty: true,
        results: [],
        completed: [],
        activity: [],
      });
  },
  changeNodes: (changes) => {
    const s = get();
    if (s.running) return;
    if (
      changes.some(
        (c) =>
          c.type === "remove" ||
          (c.type === "position" && c.dragging === undefined && c.position),
      )
    )
      s.checkpoint();
    const nodes = applyNodeChanges(changes, s.nodes) as typeof s.nodes;
    const selection = changes.filter((c) => c.type === "select");
    const selected =
      [...selection].reverse().find((c) => c.type === "select" && c.selected)
        ?.id ??
      (selection.some((c) => c.id === s.selected) ? null : s.selected);
    set({
      nodes,
      edges: s.edges.filter(
        (e) =>
          nodes.some((n) => n.id === e.source) &&
          nodes.some((n) => n.id === e.target),
      ),
      selected: nodes.some((n) => n.id === selected) ? selected : null,
    });
  },
  changeEdges: (changes) => {
    const s = get();
    if (s.running) return;
    if (changes.some((c) => c.type === "remove")) s.checkpoint();
    set({ edges: applyEdgeChanges(changes, s.edges) });
  },
  add: (kind, position) => {
    const s = get();
    if (s.running) return;
    s.checkpoint();
    const id = `${kind}-${crypto.randomUUID().slice(0, 8)}`;
    const node = makeNode(
      kind,
      id,
      position?.x ?? 400 + (s.nodes.length % 3) * 70,
      position?.y ?? 480 + (s.nodes.length % 2) * 80,
      "Added by you. Connect its sockets to make it part of the agent.",
    );
    set({
      nodes: [...s.nodes, node],
      selected: id,
      notice: `${catalog[kind].name} added. Connect its sockets to include it.`,
    });
  },
  connect: (source, target) => {
    const s = get();
    if (s.running) return;
    const error = connectionError(s, source, target);
    if (error) {
      set({ notice: error });
      return;
    }
    s.checkpoint();
    set({
      edges: [...s.edges, cable(source, target)],
      notice: "Connected. Your agent’s configuration is updated.",
    });
  },
  disconnect: (id) => {
    const s = get();
    if (s.running) return;
    s.checkpoint();
    set({
      edges: s.edges.filter((e) => e.id !== id),
      notice: "Cable disconnected.",
    });
  },
  remove: (id) => {
    const s = get();
    if (s.running) return;
    s.checkpoint();
    set({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selected: null,
      notice: "Machine removed. Undo brings it back.",
    });
  },
  update: (id, data) => {
    const s = get();
    if (s.running) return;
    s.checkpoint();
    set({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n,
      ),
      ...(s.nodes.find((n) => n.id === id)?.data.kind === "task" &&
      data.instruction !== undefined
        ? { goal: data.instruction }
        : {}),
    });
  },
  undo: () => {
    const s = get(),
      previous = s.past.at(-1);
    if (!previous || s.running) return;
    set({
      ...clone(previous),
      past: s.past.slice(0, -1),
      future: [
        clone({ nodes: s.nodes, edges: s.edges, goal: s.goal }),
        ...s.future,
      ],
      dirty: true,
      results: [],
      completed: [],
      activity: [],
    });
  },
  redo: () => {
    const s = get(),
      next = s.future[0];
    if (!next || s.running) return;
    set({
      ...clone(next),
      past: [
        ...s.past,
        clone({ nodes: s.nodes, edges: s.edges, goal: s.goal }),
      ],
      future: s.future.slice(1),
      dirty: true,
      results: [],
      completed: [],
      activity: [],
    });
  },
  save: () => {
    const s = get();
    const agent: SavedAgent = clone({
      version: 1,
      id: s.currentId || crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      title: s.title,
      summary: s.summary,
      goal: s.goal,
      nodes: s.nodes.map((n) => ({ ...n, selected: false })),
      edges: s.edges,
    });
    const saved = [agent, ...s.saved.filter((a) => a.id !== agent.id)];
    try {
      localStorage.setItem(key, JSON.stringify(saved));
      set({
        saved,
        currentId: agent.id,
        dirty: false,
        notice: "Saved in this browser.",
      });
    } catch {
      set({
        notice:
          "This browser couldn’t save. Check that local storage is allowed.",
      });
    }
  },
  open: (id) => {
    const s = get();
    if (s.running) return;
    if (s.nodes.length && s.dirty) {
      s.save();
      if (get().dirty) return;
    }
    const saved = s.saved.find((a) => a.id === id);
    if (saved) {
      runToken++;
      set({
        ...clone(saved),
        currentId: saved.id,
        screen: "workbench",
        selected: null,
        past: [],
        future: [],
        running: false,
        active: null,
        completed: [],
        activity: [],
        results: [],
        dirty: false,
        notice: "Agent reopened. Everything is editable.",
      });
    }
  },
  deleteSave: (id) => {
    const s = get();
    const saved = s.saved.filter((a) => a.id !== id);
    try {
      localStorage.setItem(key, JSON.stringify(saved));
      set({
        saved,
        ...(s.currentId === id ? { currentId: null, dirty: true } : {}),
        notice: "Saved copy removed from this browser.",
      });
    } catch {
      set({ notice: "Couldn’t update browser storage." });
    }
  },
  run: async () => {
    const s = get();
    if (s.running) return;
    const graph = clone({ nodes: s.nodes, edges: s.edges, goal: s.goal });
    let order;
    try {
      order = executionOrder(graph);
    } catch (error) {
      set({ notice: (error as Error).message });
      return;
    }
    const token = ++runToken;
    set({
      running: true,
      active: null,
      completed: [],
      results: [],
      activity: ["Simulation started. No live services are used."],
    });
    const values: Record<string, string[]> = {};
    for (const node of order) {
      if (token !== runToken) return;
      set({
        active: node.id,
        activity: [...get().activity, `${node.data.label} is working…`],
      });
      await new Promise((resolve) => setTimeout(resolve, 720));
      if (token !== runToken) return;
      values[node.id] = simulateNode(
        node,
        graph.edges
          .filter((e) => e.target === node.id)
          .flatMap((e) => values[e.source] || []),
        s.goal,
      );
      set({ completed: [...get().completed, node.id] });
    }
    set({
      running: false,
      active: null,
      results: resultsFor(graph, order, values),
      activity: [
        ...get().activity,
        `All done. ${order.length} connected machines ran.`,
      ],
      notice: "Your sample results are ready.",
    });
  },
  stop: () => {
    runToken++;
    set({
      running: false,
      active: null,
      activity: [
        ...get().activity,
        "Simulation stopped. You can edit and run again.",
      ],
      notice: "Simulation stopped.",
    });
  },
}));
