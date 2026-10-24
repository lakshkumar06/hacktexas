import { beforeEach, describe, expect, it, vi } from "vitest";
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
});
const { useLab } = await import("./store");
const original = useLab.getInitialState();
beforeEach(() => {
  vi.useRealTimers();
  storage.clear();
  useLab.setState({ ...original, saved: [] }, true);
});
describe("workbench state", () => {
  it("undoes and redoes adding, connecting and removing machines", () => {
    useLab.getState().build("help me");
    useLab.getState().add("search");
    const id = useLab.getState().selected!;
    useLab.getState().connect("brain", id);
    expect(useLab.getState().edges.some((e) => e.target === id)).toBe(true);
    useLab.getState().undo();
    expect(useLab.getState().edges.some((e) => e.target === id)).toBe(false);
    useLab.getState().undo();
    expect(useLab.getState().nodes.some((n) => n.id === id)).toBe(false);
    useLab.getState().redo();
    expect(useLab.getState().nodes.some((n) => n.id === id)).toBe(true);
    useLab.getState().remove("brain");
    expect(
      useLab
        .getState()
        .edges.every((e) => e.source !== "brain" && e.target !== "brain"),
    ).toBe(true);
  });
  it("persists exact editable configuration and reopens it", () => {
    useLab.getState().build("find sponsors");
    useLab
      .getState()
      .update("brain", { label: "My thinker", instruction: "Be concise" });
    useLab.getState().save();
    const id = useLab.getState().currentId!;
    useLab.getState().build("sort emails");
    useLab.getState().open(id);
    expect(
      useLab.getState().nodes.find((n) => n.id === "brain")?.data.label,
    ).toBe("My thinker");
    expect(useLab.getState().nodes.some((n) => n.id === "search")).toBe(true);
    expect(
      JSON.parse(storage.get("agentlab.agents.v1")!).some(
        (s: { id: string }) => s.id === id,
      ),
    ).toBe(true);
  });
  it("preserves dirty agents before regenerating", () => {
    useLab.getState().build("help me");
    useLab.getState().update("brain", { label: "Keep me" });
    useLab.getState().build("find internships");
    expect(
      useLab.getState().saved[0].nodes.find((n) => n.id === "brain")?.data
        .label,
    ).toBe("Keep me");
  });
  it("tracks keyboard movement in undo and dirty state", () => {
    useLab.getState().build("help me");
    useLab.getState().save();
    const before = useLab.getState().nodes[0].position;
    useLab
      .getState()
      .changeNodes([
        { type: "position", id: "task", position: { x: 999, y: 222 } },
      ]);
    expect(useLab.getState().dirty).toBe(true);
    useLab.getState().undo();
    expect(useLab.getState().nodes[0].position).toEqual(before);
  });
  it("keeps keyboard selection and inspector aligned", () => {
    useLab.getState().build("help me");
    useLab
      .getState()
      .changeNodes([{ type: "select", id: "brain", selected: true }]);
    expect(useLab.getState().selected).toBe("brain");
    useLab
      .getState()
      .changeNodes([{ type: "select", id: "brain", selected: false }]);
    expect(useLab.getState().selected).toBeNull();
  });
  it("updates and undoes the visible goal with Task instructions", () => {
    useLab.getState().build("find sponsors");
    useLab.getState().update("task", { instruction: "Find internships" });
    expect(useLab.getState().goal).toBe("Find internships");
    useLab.getState().undo();
    expect(useLab.getState().goal).toBe("find sponsors");
  });
  it("runs the graph, locks edits during execution, and completes results", async () => {
    vi.useFakeTimers();
    useLab.getState().build("find sponsors");
    const promise = useLab.getState().run();
    expect(useLab.getState().running).toBe(true);
    useLab.getState().remove("brain");
    expect(useLab.getState().nodes.some((n) => n.id === "brain")).toBe(true);
    await vi.runAllTimersAsync();
    await promise;
    expect(useLab.getState().running).toBe(false);
    expect(useLab.getState().results[0].lines.join(" ")).toContain(
      "Campus Coffee",
    );
    expect(useLab.getState().completed).toHaveLength(6);
  });
  it("cancels pending execution cleanly", async () => {
    vi.useFakeTimers();
    useLab.getState().build("help me");
    const promise = useLab.getState().run();
    useLab.getState().stop();
    await vi.runAllTimersAsync();
    await promise;
    expect(useLab.getState().results).toEqual([]);
    expect(useLab.getState().active).toBeNull();
    expect(useLab.getState().running).toBe(false);
  });
  it("reports storage failure without discarding the current graph", () => {
    useLab.getState().build("help me");
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("Quota");
    });
    useLab.getState().build("different goal");
    expect(useLab.getState().goal).toBe("help me");
    expect(useLab.getState().notice).toContain("couldn’t save");
    spy.mockRestore();
  });
});
