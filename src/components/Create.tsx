import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, FolderOpen } from "lucide-react";
import { useLab } from "../lib/store";
import { examples, type Kind } from "../lib/model";
import { Machine } from "./Machine";
import { LandingScene } from "./LandingScene";

export function Create({ onOpen }: { onOpen: () => void }) {
  const [goal, setGoal] = useState("");
  const s = useLab();
  function submit() {
    if (goal.trim()) s.build(goal);
  }
  return (
    <main className="create-page">
      <h1 id="goal-label">What would you like your agent to do?</h1>
      <form
        className="prompt-box"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          id="agent-goal"
          aria-labelledby="goal-label"
          placeholder="Describe a task…"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={1000}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="prompt-bottom">
          <span>Simulation only</span>
          <button
            className="button primary"
            disabled={!goal.trim()}
            type="submit"
          >
            Build my agent <ArrowRight size={17} />
          </button>
        </div>
      </form>
      <div className="suggestions">
        {examples.map((example, i) => (
          <button key={example} onClick={() => setGoal(example)}>
            {["Find sponsors", "Research internships", "Prioritize emails"][i]}
          </button>
        ))}
      </div>
      <div className="create-actions">
        <button
          className="text-button"
          onClick={() => {
            s.build(examples[0]);
            if (useLab.getState().screen === "planning") {
              useLab.getState().finishPlanning();
            }
          }}
        >
          Open example agent <ArrowRight size={14} />
        </button>
        <button className="text-button" onClick={onOpen}>
          <FolderOpen size={15} /> My agents{" "}
          {s.saved.length > 0 && (
            <span className="nav-count">{s.saved.length}</span>
          )}
        </button>
        {s.nodes.length > 0 && (
          <button
            className="text-button"
            onClick={() => useLab.setState({ screen: "workbench" })}
          >
            Resume editing <ArrowRight size={14} />
          </button>
        )}
      </div>
      <LandingScene />
    </main>
  );
}
const phases = [
  "Understanding your goal",
  "Finding the right tools",
  "Assembling your agent",
];
export function Planning() {
  const [phase, setPhase] = useState(0);
  const s = useLab();
  const reduced = useReducedMotion();
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), reduced ? 300 : 1000);
    const b = setTimeout(() => setPhase(2), reduced ? 650 : 2200);
    const c = setTimeout(
      () => useLab.getState().finishPlanning(),
      reduced ? 1300 : 4600,
    );
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [reduced]);
  return (
    <main className="planning-page">
      <h1>Building your agent</h1>
      <p className="planning-goal">“{s.goal}”</p>
      <div className="planning-steps" aria-live="polite">
        {phases.map((text, i) => (
          <div key={text} className={phase >= i ? "current" : ""}>
            <span>{phase > i ? "✓" : `0${i + 1}`}</span>
            {text}
          </div>
        ))}
      </div>
      <div className={`assembly-line ${phase === 2 ? "assembled" : ""}`}>
        {s.nodes
          .filter((n) => n.data.kind !== "task")
          .map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={{
                opacity: phase > 0 || i === 0 ? 1 : 0.15,
                y: 0,
                scale: 1,
              }}
              transition={{ delay: reduced ? 0 : i * 0.18 }}
            >
              <svg
                className="assembly-cable"
                viewBox="0 0 70 50"
                aria-hidden="true"
              >
                <path d="M0 15C20 15 10 40 35 40S45 15 70 15" />
              </svg>
              <Machine kind={node.data.kind as Kind} active={phase === 2} />
              <strong>{node.data.label}</strong>
              <p>{node.data.reason}</p>
            </motion.div>
          ))}
      </div>
    </main>
  );
}
