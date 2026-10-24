import { describe, it, expect } from "vitest";
import { planAgent, connectionError, cable, makeNode } from "./model";
import { executionOrder, runGraph } from "./execution";
describe("planner and editable execution", () => {
  it("produces distinct useful graphs for vague, research, and inbox goals", () => {
    expect(planAgent("help me").nodes.map((n) => n.data.kind)).toEqual([
      "task",
      "brain",
      "output",
      "memory",
    ]);
    expect(
      planAgent("find sponsors").nodes.some((n) => n.data.kind === "search"),
    ).toBe(true);
    expect(
      planAgent("sort my emails").nodes.some((n) => n.data.kind === "gmail"),
    ).toBe(true);
  });
  it("runs dependencies before consumers including memory", () => {
    const order = executionOrder(planAgent("find sponsors")).map((n) => n.id);
    expect(order.indexOf("memory")).toBeLessThan(order.indexOf("brain"));
    expect(order.indexOf("search")).toBeLessThan(order.indexOf("reader"));
  });
  it("changes output when the user bypasses search and reader", () => {
    const graph = planAgent("find sponsors");
    expect(runGraph(graph, graph.goal)[0].lines.join(" ")).toContain(
      "Campus Coffee",
    );
    graph.edges = [cable("task", "brain"), cable("brain", "output")];
    expect(runGraph(graph, graph.goal)[0].lines.join(" ")).not.toContain(
      "Campus Coffee",
    );
    expect(executionOrder(graph).map((n) => n.id)).not.toContain("reader");
  });
  it("blocks a disconnected output and a reachable unauthorized inbox", () => {
    const graph = planAgent("my emails");
    expect(() => executionOrder(graph)).toThrow("demo inbox");
    graph.nodes.find((n) => n.id === "gmail")!.data.authorized = true;
    expect(executionOrder(graph).length).toBe(5);
    graph.edges = [];
    expect(() => executionOrder(graph)).toThrow("Connect a path");
  });
  it("prevents loops, duplicate cables and invalid memory destinations", () => {
    const graph = planAgent("research things");
    expect(connectionError(graph, "reader", "brain")).toContain("loop");
    expect(connectionError(graph, "brain", "search")).toContain("already");
    expect(connectionError(graph, "memory", "output")).toContain("Memory");
  });
  it("uses edited task instructions and produces only reachable outputs", () => {
    const graph = planAgent("help me");
    graph.nodes[0].data.instruction = "Plan a quiet afternoon";
    graph.nodes.push(makeNode("output", "isolated", 0, 0));
    const results = runGraph(graph, graph.goal);
    expect(results).toHaveLength(1);
    expect(results[0].lines).toContain("Plan a quiet afternoon");
  });
});

describe("edited instructions and multiple outputs", () => {
  it("uses the edited Task rather than stale planning intent", () => {
    const graph = planAgent("find sponsors");
    graph.nodes[0].data.instruction = "Find internships";
    expect(runGraph(graph, graph.goal)[0].lines.join(" ")).toContain(
      "internship",
    );
    expect(runGraph(graph, graph.goal)[0].lines.join(" ")).not.toContain(
      "Campus Coffee",
    );
  });
  it("honors output length and format edits", () => {
    const graph = planAgent("find sponsors");
    graph.nodes.find((n) => n.id === "output")!.data.instruction =
      "Give me one detailed suggestion";
    graph.nodes.find((n) => n.id === "output")!.data.format = "Checklist";
    const result = runGraph(graph, graph.goal)[0];
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toContain("Sample detail");
    expect(result.format).toBe("Checklist");
  });
  it("includes only each output’s own ancestor branches in its trace", () => {
    const graph = planAgent("find sponsors");
    graph.nodes.push(makeNode("output", "other-output", 0, 0));
    graph.nodes.at(-1)!.data.label = "Quick take";
    graph.edges.push(cable("brain", "other-output"));
    const results = runGraph(graph, graph.goal);
    expect(results.find((r) => r.title === "Quick take")!.path).not.toContain(
      "Web search",
    );
    expect(results.find((r) => r.title === "Output")!.path).not.toContain(
      "Quick take",
    );
  });
});
