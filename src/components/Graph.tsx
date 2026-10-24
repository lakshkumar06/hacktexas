import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  Controls,
  useReactFlow,
  type EdgeProps,
  type NodeProps,
  type Connection,
} from "@xyflow/react";
import { motion } from "motion/react";
import "@xyflow/react/dist/style.css";
import { Machine } from "./Machine";
import { useLab } from "../lib/store";
import { catalog, type Kind, type MachineNode } from "../lib/model";

function MachineView({ id, data, selected }: NodeProps<MachineNode>) {
  const active = useLab((s) => s.active === id);
  const done = useLab((s) => s.completed.includes(id));
  const running = useLab((s) => s.running);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`machine-node ${selected ? "selected" : ""} ${active ? "working" : ""} ${done ? "finished" : ""}`}
    >
      <div className="node-status">
        {active
          ? "WORKING"
          : done
            ? "✓ DONE"
            : data.kind === "gmail"
              ? data.authorized
                ? "DEMO CONNECTED"
                : "CONNECT DEMO"
              : data.kind === "search"
                ? "READY TO SEARCH"
                : ""}
      </div>
      <Machine kind={data.kind} active={active} inspected={selected} />
      {data.kind !== "task" && data.kind !== "memory" && (
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          isConnectable={!running}
          aria-label={`${data.label} input socket`}
        />
      )}
      {data.kind !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          isConnectable={!running}
          aria-label={`${data.label} output socket`}
        />
      )}
      <div className="node-label">{data.label}</div>
      <div className="node-description">{catalog[data.kind].role}</div>
    </motion.div>
  );
}
function CableView(props: EdgeProps) {
  const active = useLab(
    (s) =>
      s.running &&
      s.active === props.target &&
      s.completed.includes(props.source),
  );
  const completed = useLab(
    (s) =>
      s.completed.includes(props.source) && s.completed.includes(props.target),
  );
  const [path] = getBezierPath({ ...props, curvature: 0.45 });
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        style={{ stroke: "transparent", strokeWidth: 20 }}
      />
      <motion.path
        d={path}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          stroke: "#354139",
          strokeWidth: props.selected ? 7 : 5,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      <motion.path
        d={path}
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          stroke: active
            ? "#e8a857"
            : completed
              ? "#91b298"
              : props.selected
                ? "#e9916b"
                : "#bbc3ae",
          strokeWidth: 2.5,
          pointerEvents: "none",
        }}
      />
      {active && <path d={path} className="flow-particles" />}
    </>
  );
}
const nodeTypes = { machine: MachineView };
const edgeTypes = { cable: CableView };
export function GraphCanvas({
  onInspect,
}: {
  onInspect: (id: string) => void;
}) {
  const s = useLab();
  const { screenToFlowPosition } = useReactFlow();
  const connect = useCallback((c: Connection) => {
    if (c.source && c.target) useLab.getState().connect(c.source, c.target);
  }, []);
  return (
    <ReactFlow
      nodes={s.nodes.map((n) => ({ ...n, selected: n.id === s.selected }))}
      edges={s.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={s.changeNodes}
      onEdgesChange={s.changeEdges}
      onConnect={connect}
      onNodeClick={(_, n) => {
        s.select(n.id);
        onInspect(n.id);
      }}
      onPaneClick={() => s.select(null)}
      onEdgeClick={() => s.select(null)}
      onNodeDragStart={s.checkpoint}
      nodesDraggable={!s.running}
      nodesConnectable={!s.running}
      elementsSelectable={!s.running}
      onDrop={(e) => {
        e.preventDefault();
        const kind = e.dataTransfer.getData("application/agentlab") as Kind;
        if (kind in catalog)
          s.add(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.25}
      maxZoom={1.7}
      deleteKeyCode={s.running ? null : ["Backspace", "Delete"]}
      panOnScroll
      selectionOnDrag={false}
      proOptions={{ hideAttribution: false }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="#bac0aa"
        gap={22}
        size={1}
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
