import { useState, useEffect } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  FolderOpen,
  Save,
  Maximize,
  Pencil,
  Play,
  Plus,
  Redo2,
  Square,
  Undo2,
  X,
} from "lucide-react";
import { catalog, type Kind } from "../lib/model";
import { useLab } from "../lib/store";
import { Machine } from "./Machine";
import { GraphCanvas } from "./Graph";
import { Inspector } from "./Inspector";

function Shelf() {
  const s = useLab();
  return (
    <aside className="library">
      <div className="panel-heading">
        <span>Components</span>
      </div>

      <div className="library-items">
        {(Object.keys(catalog) as Kind[]).map((kind) => (
          <button
            key={kind}
            className="library-item"
            disabled={s.running}
            draggable={!s.running}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/agentlab", kind);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => s.add(kind)}
            aria-label={`Add ${catalog[kind].name}`}
          >
            <Machine kind={kind} />
            <span>
              <strong>{catalog[kind].name}</strong>
              <small>{catalog[kind].role}</small>
            </span>
            <Plus size={15} />
          </button>
        ))}
      </div>
    </aside>
  );
}
function WorkbenchInner({
  onGmail,
  onEdit,
  onHelp,
  onOpen,
}: {
  onGmail: (id: string) => void;
  onEdit: () => void;
  onHelp: () => void;
  onOpen: () => void;
}) {
  const s = useLab();
  const [expanded, setExpanded] = useState(false),
    [tab, setTab] = useState<"activity" | "results">("activity");
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (s.results.length) {
      setExpanded(true);
      setTab("results");
    }
  }, [s.results]);
  useEffect(() => {
    const timer = setTimeout(
      () => fitView({ padding: 0.2, duration: 0, maxZoom: 1 }),
      100,
    );
    return () => clearTimeout(timer);
  }, [s.currentId, s.goal, fitView]);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        fitView({
          padding: 0.2,
          duration: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 250,
          maxZoom: 1,
        }),
      50,
    );
    return () => clearTimeout(timer);
  }, [s.nodes.length, fitView]);
  const links = s.edges.length;
  return (
    <main className="workbench">
      <div className="workbench-title">
        <div>
          <h1>
            {s.title}
            <span className="draft-badge">
              {s.dirty ? "Unsaved" : "Saved locally"}
            </span>
          </h1>
        </div>
        <button
          className="text-button edit-prompt"
          onClick={onEdit}
          disabled={s.running}
        >
          <Pencil size={13} /> Edit prompt
        </button>
      </div>
      <div className="workbench-body">
        <Shelf />
        <section className="canvas-area" aria-label="Agent canvas">
          <div className="canvas-toolbar">
            <span>
              <span className="status-dot" />
              {s.nodes.length} parts · {links} connections
            </span>
            <div>
              <button
                className="icon-button"
                title="Undo (⌘/Ctrl Z)"
                aria-label="Undo"
                onClick={s.undo}
                disabled={!s.past.length || s.running}
              >
                <Undo2 size={17} />
              </button>
              <button
                className="icon-button"
                title="Redo (⌘/Ctrl Shift Z)"
                aria-label="Redo"
                onClick={s.redo}
                disabled={!s.future.length || s.running}
              >
                <Redo2 size={17} />
              </button>
              <span className="toolbar-separator" />
              <button
                className="icon-button"
                title="Fit everything in view"
                aria-label="Fit canvas"
                onClick={() =>
                  fitView({ padding: 0.2, maxZoom: 1, duration: 0 })
                }
              >
                <Maximize size={16} />
              </button>
            </div>
          </div>
          <GraphCanvas
            onInspect={(id) => {
              const node = useLab.getState().nodes.find((n) => n.id === id);
              if (
                node?.data.kind === "gmail" &&
                !node.data.authorized &&
                !s.running
              )
                onGmail(id);
            }}
          />
        </section>
        <Inspector onGmail={onGmail} />
      </div>
      <section
        className={`run-dock ${expanded ? "expanded" : ""}`}
        aria-label="Simulation controls"
      >
        <div className="run-bar">
          <div className="workbench-actions">
            <button
              className="icon-button"
              aria-label="Create a new agent"
              title="New agent"
              disabled={s.running}
              onClick={s.home}
            >
              <Plus size={17} />
            </button>
            <button
              className="text-button"
              onClick={onOpen}
              disabled={s.running}
            >
              <FolderOpen size={15} /> My agents{" "}
              {s.saved.length > 0 && (
                <span className="nav-count">{s.saved.length}</span>
              )}
            </button>
            <button className="button small" onClick={s.save}>
              <Save size={14} /> Save agent
            </button>
            <button
              className="icon-button"
              aria-label="Help"
              title="Help"
              onClick={onHelp}
            >
              <CircleHelp size={16} />
            </button>
          </div>
          <div className="run-actions">
            <span className="simulation-note">Simulation</span>
            <button
              className="text-button activity-button"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              Activity & results{" "}
              {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {s.running ? (
              <button className="button primary" onClick={s.stop}>
                <Square size={15} /> Stop simulation
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => {
                  setTab("activity");
                  void s.run();
                }}
              >
                <Play size={15} fill="currentColor" /> Run my agent
              </button>
            )}
          </div>
        </div>
        {expanded && (
          <div className="run-content">
            <div className="result-tabs">
              <button
                className={tab === "activity" ? "active" : ""}
                onClick={() => setTab("activity")}
              >
                Activity <span>{s.activity.length}</span>
              </button>
              <button
                className={tab === "results" ? "active" : ""}
                onClick={() => setTab("results")}
              >
                Your results <span>{s.results.length}</span>
              </button>
              <button
                className="icon-button close-results"
                aria-label="Collapse results"
                onClick={() => setExpanded(false)}
              >
                <X size={16} />
              </button>
            </div>
            {tab === "activity" ? (
              <div className="activity-list" aria-live="polite">
                {s.activity.length ? (
                  s.activity.map((line, i) => (
                    <div key={i}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span>{line}</span>
                    </div>
                  ))
                ) : (
                  <p>
                    Press “Run my agent” to watch information travel through
                    your connected machines.
                  </p>
                )}
              </div>
            ) : (
              <div className="results-list">
                {s.results.length ? (
                  s.results.map((result, index) => (
                    <article className="result-sheet" key={index}>
                      <div className="result-heading">
                        <h3>{result.title}</h3>
                        <span className="small-badge">SAMPLE RESULTS</span>
                        <button
                          className="icon-button"
                          aria-label="Copy results"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                `Simulated sample results\n\n${result.lines.join("\n")}`,
                              );
                              s.notify("Sample results copied.");
                            } catch {
                              s.notify(
                                "Copy isn’t available in this browser. You can select the result text.",
                              );
                            }
                          }}
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                      <ul
                        className={
                          result.format === "Checklist" ? "checklist" : ""
                        }
                      >
                        {result.lines.map((line, i) => (
                          <li key={i}>
                            {result.format === "Checklist" && (
                              <Check size={15} />
                            )}
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="result-trace">
                        Contributing parts: {result.path.join(" · ")}
                      </p>
                      <details className="run-settings">
                        <summary>Settings used for this run</summary>
                        {result.instructions.map((item, i) => (
                          <p key={i}>
                            <strong>{item.name}:</strong> {item.instruction}
                          </p>
                        ))}
                      </details>
                      <p className="result-disclaimer">
                        Illustrative data only. No web pages or emails were
                        accessed.
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="no-results">
                    Your results will land here after a successful simulation.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
export function Workbench(props: {
  onGmail: (id: string) => void;
  onEdit: () => void;
  onHelp: () => void;
  onOpen: () => void;
}) {
  return (
    <ReactFlowProvider>
      <WorkbenchInner {...props} />
    </ReactFlowProvider>
  );
}
