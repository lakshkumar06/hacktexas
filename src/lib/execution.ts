import type { Graph, MachineNode } from "./model";
export type Result = {
  title: string;
  lines: string[];
  path: string[];
  format: "Brief" | "Checklist";
  instructions: { name: string; instruction: string }[];
};
export function executionOrder(graph: Graph): MachineNode[] {
  const starts = graph.nodes.filter((n) => n.data.kind === "task");
  if (!starts.length)
    throw new Error("Add a Task so your agent knows where to begin.");
  const reachable = new Set<string>();
  function visit(id: string) {
    if (reachable.has(id)) return;
    reachable.add(id);
    graph.edges.filter((e) => e.source === id).forEach((e) => visit(e.target));
  }
  starts.forEach((n) => visit(n.id));
  // Context sources participate only when attached to an active Brain.
  graph.nodes
    .filter(
      (n) =>
        n.data.kind === "memory" &&
        graph.edges.some((e) => e.source === n.id && reachable.has(e.target)),
    )
    .forEach((n) => reachable.add(n.id));
  if (!graph.nodes.some((n) => n.data.kind === "output" && reachable.has(n.id)))
    throw new Error("Connect a path from Task to Output before running.");
  const active = graph.nodes.filter((n) => reachable.has(n.id));
  const pending = new Set(active.map((n) => n.id));
  const sorted: MachineNode[] = [];
  while (pending.size) {
    const next = active.find(
      (n) =>
        pending.has(n.id) &&
        !graph.edges.some((e) => e.target === n.id && pending.has(e.source)),
    );
    if (!next)
      throw new Error(
        "There’s a loop in the cables. Remove one connection and try again.",
      );
    if (next.data.kind === "gmail" && !next.data.authorized)
      throw new Error("Open Gmail and connect the demo inbox before running.");
    sorted.push(next);
    pending.delete(next.id);
  }
  return sorted;
}
function shapeSample(lines: string[], instruction: string): string[] {
  let result = [...lines];
  if (/\b(one|single|first)\b/i.test(instruction)) result = result.slice(0, 1);
  else if (/\b(short|brief|concise)\b/i.test(instruction))
    result = result.slice(0, 3).map((line) => line.split(" Next step:")[0]);
  if (/\b(detail|detailed|thorough)\b/i.test(instruction))
    result = result.map(
      (line) =>
        `${line} Sample detail: review fit, timing, and your preferred next action.`,
    );
  if (/\b(number|numbered)\b/i.test(instruction))
    result = result.map((line, i) => `${i + 1}. ${line}`);
  return result;
}
export function simulateNode(
  node: MachineNode,
  inputs: string[],
  goal: string,
): string[] {
  switch (node.data.kind) {
    case "task":
      return [node.data.instruction || goal];
    case "memory":
      return [`Preference note: ${node.data.instruction}`];
    case "brain":
      return [...inputs, `Approach: ${node.data.instruction}`];
    case "search": {
      const explicitFocus = /sponsor|club|intern|job|career|email|inbox/i.test(
        node.data.instruction,
      );
      const context = explicitFocus
        ? node.data.instruction
        : inputs.length
          ? inputs.join(" ")
          : goal;
      if (/sponsor|club/i.test(context))
        return [
          "Campus Coffee Co. — sample local sponsor; a good fit for student events.",
          "Brightside Studio — sample creative partner; could support event materials.",
          "Community Credit Union — sample education partner; explore a student initiative.",
        ];
      if (/intern|job|career/i.test(context))
        return [
          "Design internship — sample summer role at a small creative studio.",
          "Software internship — sample role with a campus technology team.",
          "Research assistant — sample opportunity in a university lab.",
        ];
      return [
        `Sample finding: a beginner’s guide related to “${goal}”.`,
        "Sample finding: a practical checklist from a community resource.",
        "Sample finding: a comparison of three possible approaches.",
      ];
    }
    case "reader":
      return shapeSample(
        inputs.length
          ? inputs.map(
              (line) =>
                `${line} Next step: verify the details with the original source.`,
            )
          : [
              "No incoming findings. Connect Search to this reader to review sample pages.",
            ],
        node.data.instruction,
      );
    case "gmail": {
      let mail = [
        "Reply today: Maya asks you to confirm tomorrow’s meeting.",
        "This week: Career Center shared a sample internship roundup.",
        "Can wait: the weekly community newsletter.",
      ];
      if (/only.*(urgent|today)|urgent.*only/i.test(node.data.instruction))
        mail = mail.slice(0, 1);
      if (/only.*newsletter/i.test(node.data.instruction)) mail = mail.slice(2);
      return shapeSample(mail, node.data.instruction);
    }
    case "output":
      return shapeSample(
        inputs.length
          ? inputs
          : ["No incoming information yet. Connect a machine to this Output."],
        node.data.instruction,
      );
  }
}
export function resultsFor(
  graph: Graph,
  order: MachineNode[],
  values: Record<string, string[]>,
): Result[] {
  return order
    .filter((n) => n.data.kind === "output")
    .map((node) => {
      const ancestors = new Set<string>();
      function trace(id: string) {
        if (ancestors.has(id)) return;
        ancestors.add(id);
        graph.edges
          .filter((e) => e.target === id)
          .forEach((e) => trace(e.source));
      }
      trace(node.id);
      const contributors = order.filter((n) => ancestors.has(n.id));
      return {
        title: node.data.label,
        lines: values[node.id] || [],
        path: contributors.map((n) => n.data.label),
        format: node.data.format || "Brief",
        instructions: contributors.map((n) => ({
          name: n.data.label,
          instruction: n.data.instruction,
        })),
      };
    });
}
export function runGraph(graph: Graph, goal: string) {
  const order = executionOrder(graph),
    values: Record<string, string[]> = {};
  order.forEach((node) => {
    values[node.id] = simulateNode(
      node,
      graph.edges
        .filter((e) => e.target === node.id)
        .flatMap((e) => values[e.source] || []),
      goal,
    );
  });
  return resultsFor(graph, order, values);
}
