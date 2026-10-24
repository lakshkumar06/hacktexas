// @vitest-environment jsdom
import {
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import App from "../App";
import { useLab } from "../lib/store";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
});
beforeEach(() => {
  localStorage.clear();
  useLab.setState(useLab.getInitialState(), true);
});
afterEach(cleanup);
async function build(goal: string) {
  render(<App />);
  fireEvent.change(
    screen.getByLabelText("What would you like your agent to do?"),
    { target: { value: goal } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Build my agent" }));
  await waitFor(
    () =>
      expect(screen.getByRole("button", { name: "Run my agent" })).toBeTruthy(),
    { timeout: 6000 },
  );
}
describe("rendered application journey (DOM, not browser layout)", () => {
  it("takes a vague goal through planning, settings, execution, save and reopen", async () => {
    await build("help me organize my day");
    const name = screen.getByLabelText("Component name");
    fireEvent.change(name, { target: { value: "Thoughtful helper" } });
    fireEvent.blur(name);
    fireEvent.click(screen.getByRole("button", { name: "Save agent" }));
    const saved = JSON.parse(localStorage.getItem("agentlab.agents.v1")!);
    expect(
      saved[0].nodes.find((n: { id: string }) => n.id === "brain").data.label,
    ).toBe("Thoughtful helper");
    fireEvent.click(screen.getByRole("button", { name: "Run my agent" }));
    await waitFor(
      () => expect(screen.getByText("SAMPLE RESULTS")).toBeTruthy(),
      { timeout: 6000 },
    );
    expect(
      screen.getByText(
        "Illustrative data only. No web pages or emails were accessed.",
      ),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "My agents 1" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Task agent.*help me organize/,
      }),
    );
    expect(
      useLab.getState().nodes.find((n) => n.id === "brain")?.data.label,
    ).toBe("Thoughtful helper");
    expect(useLab.getState().results).toEqual([]);
  }, 15000);
  it("supports adding a tool, keyboard-friendly connection settings, undo, and redo", async () => {
    await build("help me");
    fireEvent.click(screen.getByRole("button", { name: "Add Web search" }));
    expect(screen.getByRole("heading", { name: "Web search" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Connect to component"), {
      target: { value: "output" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add connection" }));
    expect(
      useLab
        .getState()
        .edges.some(
          (e) => e.source.startsWith("search-") && e.target === "output",
        ),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(
      useLab.getState().edges.some((e) => e.source.startsWith("search-")),
    ).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(
      useLab.getState().edges.some((e) => e.source.startsWith("search-")),
    ).toBe(true);
  }, 10000);
  it("requires a clearly simulated Gmail connection and permits cancellation", async () => {
    await build("read my emails");
    fireEvent.click(screen.getByRole("button", { name: "Run my agent" }));
    expect(screen.getByRole("status").textContent).toContain("demo inbox");
    const gmail = document.querySelector('.react-flow__node[data-id="gmail"]')!;
    fireEvent.click(gmail);
    expect(
      screen.getByRole("dialog", { name: "Connect demo inbox" }),
    ).toBeTruthy();
    expect(
      screen.getByText("No sign-in. No credentials. No emails sent."),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Allow demo connection" }),
    );
    expect(
      useLab.getState().nodes.find((n) => n.id === "gmail")?.data.authorized,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Run my agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop simulation" }));
    expect(useLab.getState().running).toBe(false);
  }, 10000);
});
