import { Machine } from "./Machine";

export function LandingScene() {
  return (
    <div className="landing-scene" aria-hidden="true">
      <svg
        className="landing-cables"
        viewBox="0 0 700 160"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M135 88C210 88 170 142 250 125S270 72 340 88M390 92C455 72 450 138 510 120S540 78 580 92" />
        <path
          className="landing-cable-highlight"
          d="M135 88C210 88 170 142 250 125S270 72 340 88M390 92C455 72 450 138 510 120S540 78 580 92"
        />
      </svg>
      <div className="landing-machine landing-brain">
        <Machine kind="brain" />
      </div>
      <div className="landing-machine landing-search">
        <Machine kind="search" />
      </div>
      <div className="landing-machine landing-output">
        <Machine kind="output" />
      </div>
      <svg className="landing-plant" viewBox="0 0 100 150" fill="none">
        <ellipse cx="51" cy="139" rx="35" ry="7" fill="#788c73" opacity=".14" />
        <g stroke="#354139" strokeWidth="2" strokeLinejoin="round">
          <path d="M49 101V39m1 45L28 62m23 5 20-26" />
          <path d="M49 57Q20 46 29 21q28 7 20 36Z" fill="#a4bf94" />
          <path d="M50 75q-3-34 31-42 5 28-31 42Z" fill="#78a58b" />
          <path d="M44 92Q12 86 13 61q30-2 31 31Z" fill="#96b788" />
          <path d="M54 104q0-29 30-28-2 25-30 28Z" fill="#bad0a1" />
          <path d="M27 102h49l-6 32q-17 11-36 0Z" fill="#dfa185" />
          <path d="M24 100h55v10H24Z" fill="#f0b59a" />
        </g>
      </svg>
    </div>
  );
}
