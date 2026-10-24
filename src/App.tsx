import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { ArrowRight, Check, FlaskConical, Save, Trash2, X } from "lucide-react";
import { useLab } from "./lib/store";
import { Create, Planning } from "./components/Create";
import { Workbench } from "./components/Workbench";
import { Dialog } from "./components/Dialog";
import { Machine } from "./components/Machine";

type Modal = "saved" | "edit" | "help" | "gmail" | null;
export default function App() {
  const s = useLab();
  const [modal, setModal] = useState<Modal>(null),
    [gmailId, setGmailId] = useState(""),
    [draft, setDraft] = useState("");
  const close = useCallback(() => setModal(null), []);
  const gmail = (id: string) => {
    setGmailId(id);
    setModal("gmail");
  };
  useEffect(() => {
    if (!s.notice) return;
    const timer = setTimeout(() => useLab.getState().notify(""), 6500);
    return () => clearTimeout(timer);
  }, [s.notice]);
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (modal || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
        return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) s.redo();
        else s.undo();
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "s" &&
        s.screen === "workbench"
      ) {
        event.preventDefault();
        s.save();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal, s.undo, s.redo, s.save, s.screen]);
  const gmailNode = s.nodes.find((n) => n.id === gmailId);
  return (
    <MotionConfig reducedMotion="user">
      <div className={`app screen-${s.screen}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={s.screen}
            className="screen-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {s.screen === "create" ? (
              <Create onOpen={() => setModal("saved")} />
            ) : s.screen === "planning" ? (
              <Planning />
            ) : (
              <Workbench
                onOpen={() => setModal("saved")}
                onGmail={gmail}
                onEdit={() => {
                  setDraft(s.goal);
                  setModal("edit");
                }}
                onHelp={() => setModal("help")}
              />
            )}
          </motion.div>
        </AnimatePresence>
        {modal === "saved" && (
          <Dialog title="Saved agents" onClose={close}>
            <p className="dialog-description">Stored in this browser.</p>
            {s.saved.length ? (
              <div className="saved-list">
                {s.saved.map((agent) => (
                  <div className="saved-agent" key={agent.id}>
                    <Machine kind="brain" />
                    <button
                      className="saved-open"
                      onClick={() => {
                        s.open(agent.id);
                        close();
                      }}
                    >
                      <strong>{agent.title}</strong>
                      <span>{agent.goal}</span>
                      <small>
                        {agent.nodes.length} parts ·{" "}
                        {new Date(agent.savedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </small>
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete saved ${agent.title}`}
                      onClick={() => s.deleteSave(agent.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-collection">
                <Machine kind="memory" />
                <h3>No saved agents</h3>
                <p>Build an agent, then choose “Save agent” to keep it here.</p>
              </div>
            )}
            <div className="dialog-footer">
              <span>Your agents stay on this device.</span>
              <button className="button small" onClick={close}>
                Close <ArrowRight size={14} />
              </button>
            </div>
          </Dialog>
        )}
        {modal === "edit" && (
          <Dialog title="Edit goal" onClose={close}>
            <p className="dialog-description">
              Change your idea and we’ll propose a fresh arrangement. This
              replaces the current workbench. We’ll save your current edits
              locally first, so you can always come back.
            </p>
            <label className="dialog-label" htmlFor="edit-goal">
              What would you like your agent to do?
            </label>
            <textarea
              id="edit-goal"
              className="edit-goal"
              rows={4}
              value={draft}
              maxLength={1000}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="dialog-footer">
              <button className="text-button" onClick={s.save}>
                <Save size={15} /> Save current agent
              </button>
              <button
                className="button primary"
                disabled={!draft.trim()}
                onClick={() => {
                  s.build(draft);
                  close();
                }}
              >
                Rebuild my agent <ArrowRight size={16} />
              </button>
            </div>
          </Dialog>
        )}
        {modal === "gmail" && gmailNode && (
          <Dialog
            title={
              gmailNode.data.authorized
                ? "Your demo inbox"
                : "Connect demo inbox"
            }
            onClose={close}
          >
            <div className="auth-illustration">
              <Machine kind="gmail" />
            </div>
            <div className="preview-notice">
              <FlaskConical size={16} /> SIMULATED GOOGLE CONNECTION
            </div>
            <h3 className="auth-title">
              {gmailNode.data.authorized
                ? "Your sample inbox is connected."
                : "Use the sample inbox."}
            </h3>
            <p className="dialog-description">
              This is an authorization preview. No Google account is used, and
              AgentLab cannot access your real email.
            </p>
            <div className="demo-account">
              <span className="demo-avatar">A</span>
              <div>
                <strong>Alex’s demo inbox</strong>
                <span>3 fictional emails, ready to organize</span>
              </div>
            </div>
            <ul className="auth-permissions">
              <li>
                <Check size={15} /> Read sample messages
              </li>
              <li>
                <Check size={15} /> Organize a simulated priority list
              </li>
            </ul>
            <p className="privacy-note">
              No sign-in. No credentials. No emails sent.
            </p>
            <button
              className="button primary full-width"
              onClick={() => {
                s.update(gmailId, { authorized: !gmailNode.data.authorized });
                s.notify(
                  gmailNode.data.authorized
                    ? "Demo inbox disconnected."
                    : "Demo inbox connected. Ready for a simulated run.",
                );
                close();
              }}
            >
              {gmailNode.data.authorized
                ? "Disconnect demo inbox"
                : "Allow demo connection"}
              <ArrowRight size={16} />
            </button>
          </Dialog>
        )}
        {modal === "help" && (
          <Dialog title="How to use the editor" onClose={close}>
            <ol className="help-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Edit a component</strong>
                  <p>
                    Click a machine to see why it’s here and change its
                    instructions.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Make a connection</strong>
                  <p>
                    Drag from a right socket to a left socket. Or use “Connect
                    to…” in the settings. Select a cable and press Delete to
                    remove it.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Run the simulation</strong>
                  <p>
                    Run follows your connected machines. Disconnected parts sit
                    this one out. Gmail uses a demo inbox.
                  </p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Save and undo</strong>
                  <p>
                    Undo and redo canvas edits with the arrows or ⌘/Ctrl Z. Save
                    your agent to reopen it in this browser.
                  </p>
                </div>
              </li>
            </ol>
            <button className="button primary full-width" onClick={close}>
              Close <ArrowRight size={16} />
            </button>
          </Dialog>
        )}
        <AnimatePresence>
          {s.notice && (
            <motion.div
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <span>{s.notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => s.notify("")}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
