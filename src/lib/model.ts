import type { Edge, Node } from "@xyflow/react";

export type Kind =
  "task" | "brain" | "search" | "reader" | "memory" | "gmail" | "output";
export type MachineData = {
  kind: Kind;
  label: string;
  instruction: string;
  reason: string;
  authorized?: boolean;
  format?: "Brief" | "Checklist";
  [key: string]: unknown;
};
export type MachineNode = Node<MachineData, "machine">;
export type Graph = { nodes: MachineNode[]; edges: Edge[] };
export type Plan = Graph & { goal: string; title: string; summary: string };
export const catalog: Record<
  Kind,
  { name: string; role: string; color: string; instruction: string }
> = {
  task: {
    name: "Your task",
    role: "Defines the goal",
    color: "#f2d275",
    instruction: "Use the goal as your starting point.",
  },
  brain: {
    name: "Brain",
    role: "Processes instructions",
    color: "#b1b4de",
    instruction: "Think it through, keep it useful, and explain things simply.",
  },
  search: {
    name: "Web search",
    role: "Searches the web",
    color: "#a8c8a3",
    instruction: "Find a few relevant, trustworthy starting points.",
  },
  reader: {
    name: "Read a page",
    role: "Extracts page details",
    color: "#efab8f",
    instruction: "Read the findings and pull out the important details.",
  },
  memory: {
    name: "Memory",
    role: "Stores context",
    color: "#f0ce71",
    instruction: "Remember my preferences and avoid repeating suggestions.",
  },
  gmail: {
    name: "Gmail",
    role: "Reads sample emails",
    color: "#eaa09a",
    instruction: "Read the sample inbox and group messages by priority.",
  },
  output: {
    name: "Output",
    role: "Formats results",
    color: "#a7c7c0",
    instruction: "Make a short, useful summary with clear next steps.",
  },
};
export const examples = [
  "Find sponsors for my college club",
  "Research internships and organize opportunities",
  "Read my emails and help me prioritize them",
];
export function makeNode(
  kind: Kind,
  id: string,
  x: number,
  y: number,
  reason = "",
): MachineNode {
  return {
    id,
    type: "machine",
    position: { x, y },
    data: {
      kind,
      label: catalog[kind].name,
      instruction: catalog[kind].instruction,
      reason,
      format: "Brief",
    },
  };
}
export function cable(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    sourceHandle: "out",
    targetHandle: "in",
    type: "cable",
  };
}
export function planAgent(rawGoal: string): Plan {
  const goal = rawGoal.trim() || "Help me organize my day";
  const email = /email|inbox|gmail|mail\b/i.test(goal);
  const internships = /intern|job|career|opportunit/i.test(goal);
  const sponsors = /sponsor|club|fundrais/i.test(goal);
  const research =
    sponsors ||
    internships ||
    /research|find|search|learn|compare|travel|trip/i.test(goal);
  const title = email
    ? "Email priorities"
    : internships
      ? "Internship research"
      : sponsors
        ? "Sponsor research"
        : research
          ? "Research agent"
          : "Task agent";
  const chain: Kind[] = email
    ? ["task", "brain", "gmail", "output"]
    : research
      ? ["task", "brain", "search", "reader", "output"]
      : ["task", "brain", "output"];
  const reasons: Record<Kind, string> = {
    task: "Every helpful agent starts with your idea. You can change it any time.",
    brain:
      "A thinking partner to understand your goal and decide what matters.",
    search: sponsors
      ? "To discover organizations that could support your club."
      : internships
        ? "To discover internships that match your interests."
        : "To find useful starting points across the web.",
    reader:
      "To look beyond a headline and turn sample pages into useful details.",
    memory: "To keep your preferences close to the Brain while it works.",
    gmail:
      "To sort a sample inbox into what needs attention and what can wait.",
    output: "To bring everything together in a readable result you can use.",
  };
  const nodes = chain.map((kind, index) =>
    makeNode(kind, kind, 60 + index * 230, 150, reasons[kind]),
  );
  nodes[0].data.instruction = goal;
  const memory = makeNode("memory", "memory", 290, 420, reasons.memory);
  nodes.push(memory);
  const edges = chain.slice(1).map((kind, i) => cable(chain[i], kind));
  edges.push(cable("memory", "brain"));
  return {
    goal,
    title,
    nodes,
    edges,
    summary: email
      ? "Prioritize sample inbox messages."
      : sponsors
        ? "Research potential club sponsors."
        : internships
          ? "Research internship opportunities."
          : "Process your goal and produce a result.",
  };
}
export function connectionError(
  graph: Graph,
  source: string,
  target: string,
): string | null {
  if (source === target) return "Try connecting two different machines.";
  const a = graph.nodes.find((n) => n.id === source),
    b = graph.nodes.find((n) => n.id === target);
  if (!a || !b) return "Both machines need to be on the workbench.";
  if (a.data.kind === "output") return "Output is the end of the journey.";
  if (b.data.kind === "task" || b.data.kind === "memory")
    return "This machine is a starting point. Use its right socket.";
  if (a.data.kind === "memory" && b.data.kind !== "brain")
    return "Memory connects to Brain to share context.";
  if (graph.edges.some((e) => e.source === source && e.target === target))
    return "These machines are already connected.";
  const visited = new Set<string>();
  function reaches(id: string): boolean {
    if (id === source) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return graph.edges
      .filter((e) => e.source === id)
      .some((e) => reaches(e.target));
  }
  return reaches(target)
    ? "That would make a loop. Connect toward the Output instead."
    : null;
}
