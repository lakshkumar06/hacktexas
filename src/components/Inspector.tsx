import { useState, useEffect } from "react";
import {
  ArrowRight,
  Cable,
  Trash2,
  X,
  Check,
  ExternalLink,
} from "lucide-react";
import { connectionError } from "../lib/model";
import { useLab } from "../lib/store";
export function Inspector({ onGmail }: { onGmail: (id: string) => void }) {
  const s = useLab(),
    node = s.nodes.find((n) => n.id === s.selected);
  const [label, setLabel] = useState(""),
    [instruction, setInstruction] = useState(""),
    [target, setTarget] = useState("");
  useEffect(() => {
    setLabel(node?.data.label || "");
    setInstruction(node?.data.instruction || "");
    setTarget("");
  }, [node?.id, node?.data.label, node?.data.instruction]);
  if (!node)
    return (
      <aside className="inspector empty-inspector">
        <p>Select a component to edit its settings.</p>
      </aside>
    );
  const connections = s.edges.filter(
    (e) => e.source === node.id || e.target === node.id,
  );
  const destinations = s.nodes.filter(
    (n) => !connectionError(s, node.id, n.id),
  );
  const saveLabel = () => {
    if (label.trim() && label.trim() !== node.data.label)
      s.update(node.id, { label: label.trim() });
    else if (!label.trim()) setLabel(node.data.label);
  };
  const saveInstruction = () => {
    if (instruction !== node.data.instruction)
      s.update(node.id, { instruction });
  };
  return (
    <aside className="inspector" aria-label="Component settings">
      <div className="panel-heading">
        <span>Settings</span>
        <button
          className="icon-button"
          aria-label="Close inspector"
          onClick={() => s.select(null)}
        >
          <X size={16} />
        </button>
      </div>
      <h2>{node.data.label}</h2>
      <fieldset disabled={s.running} className="settings-fieldset">
        <label>
          Name
          <input
            aria-label="Component name"
            value={label}
            maxLength={40}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={saveLabel}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </label>
        <label>
          Instructions
          <textarea
            aria-label="Component instructions"
            value={instruction}
            maxLength={1000}
            onChange={(e) => setInstruction(e.target.value)}
            onBlur={saveInstruction}
            rows={3}
          />
        </label>
        {node.data.kind === "output" && (
          <label>
            Format
            <select
              value={node.data.format}
              onChange={(e) =>
                s.update(node.id, {
                  format: e.target.value as "Brief" | "Checklist",
                })
              }
            >
              <option>Brief</option>
              <option>Checklist</option>
            </select>
          </label>
        )}
        <p className="settings-note">
          Edits apply when you leave a field. In this simulation, short,
          detailed, and numbered instructions change the sample response.
        </p>
        {node.data.kind === "search" && (
          <p className="integration-note">
            <Check size={14} /> Ready to use · No API key needed
            <br />
            <span>Uses sample search results in this prototype.</span>
          </p>
        )}
        {node.data.kind === "gmail" && (
          <button
            className="button full-width small"
            onClick={() => onGmail(node.id)}
          >
            {node.data.authorized ? "Manage demo inbox" : "Connect demo inbox"}
            <ExternalLink size={14} />
          </button>
        )}
        <div className="connections">
          <h3>
            <Cable size={15} /> Connected to <span>{connections.length}</span>
          </h3>
          {connections.length === 0 && (
            <p>No cables yet. Let’s make a connection.</p>
          )}
          {connections.map((edge) => {
            const other = s.nodes.find(
              (n) =>
                n.id === (edge.source === node.id ? edge.target : edge.source),
            );
            return (
              <div className="connection-item" key={edge.id}>
                <span>
                  {edge.source === node.id ? "→" : "←"} {other?.data.label}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Disconnect ${s.nodes.find((n) => n.id === edge.source)?.data.label} from ${s.nodes.find((n) => n.id === edge.target)?.data.label}`}
                  onClick={() => s.disconnect(edge.id)}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
          {destinations.length > 0 && (
            <div className="connect-row">
              <select
                aria-label="Connect to component"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Connect to…</option>
                {destinations.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.label}
                  </option>
                ))}
              </select>
              <button
                className="icon-button bordered"
                aria-label="Add connection"
                disabled={!target}
                onClick={() => {
                  s.connect(node.id, target);
                  setTarget("");
                }}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <button className="remove-button" onClick={() => s.remove(node.id)}>
          <Trash2 size={14} /> Remove component
        </button>
      </fieldset>
    </aside>
  );
}
