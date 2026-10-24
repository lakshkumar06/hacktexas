import { useId, type ReactNode } from "react";
import type { Kind } from "../lib/model";

type Props = {
  kind: Kind;
  active?: boolean;
  inspected?: boolean;
  className?: string;
};
const ink = "#354139";
function Screw({ x, y }: { x: number; y: number }) {
  return (
    <g strokeWidth="1.2">
      <circle cx={x} cy={y} r="2.2" fill="#faf6e9" />
      <path d={`M${x - 1} ${y + 1}l2 -2`} />
    </g>
  );
}
function Shell({
  fill,
  side,
  top,
  x = 29,
  y = 51,
  w = 126,
  h = 98,
  children,
}: {
  fill: string;
  side: string;
  top: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  children?: ReactNode;
}) {
  return (
    <g>
      <path d={`M${x} ${y}l21 -15h${w}l-21 15Z`} fill={top} />
      <path d={`M${x + w} ${y}l21 -15v${h}l-21 15Z`} fill={side} />
      <rect x={x} y={y} width={w} height={h} rx="5" fill={fill} />
      {children}
    </g>
  );
}
function Feet({ y = 150 }: { y?: number }) {
  return (
    <g fill="#4a554b">
      <path d={`M42 ${y}v10h12v-10M132 ${y}v10h12v-10`} />
    </g>
  );
}
function Lamp({ x, y, active }: { x: number; y: number; active?: boolean }) {
  return (
    <circle
      className={active ? "machine-lamp on" : "machine-lamp"}
      cx={x}
      cy={y}
      r="4"
      fill={active ? "#d4f37a" : "#f4d375"}
    />
  );
}
export function Machine({
  kind,
  active = false,
  inspected = false,
  className = "",
}: Props) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`machine-art ${active ? "is-active" : ""} ${inspected ? "is-inspected" : ""} ${className}`}
      viewBox="0 0 210 200"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`paper-${id}`}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".5" fill="#354139" opacity=".08" />
        </pattern>
      </defs>
      <ellipse cx="107" cy="170" rx="78" ry="12" fill="#788c73" opacity=".12" />
      <g
        stroke={ink}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {kind === "brain" && (
          <>
            <Feet />
            <Shell fill="#b6b5df" side="#8c8fb9" top="#d5d3ec" h={104}>
              <path d="M50 57V38l17 -10" />
              <circle cx="69" cy="25" r="5" fill="#f19473" />
              <rect
                x="40"
                y="63"
                width="103"
                height="62"
                rx="9"
                fill="#788b80"
              />
              <rect
                x="46"
                y="69"
                width="91"
                height="48"
                rx="6"
                fill="#eff1ce"
              />
              <g className="brain-face">
                <path d="M66 88v7m48-7v7" strokeWidth="5" />
                <path d="M79 100q11 9 23 -1" strokeWidth="2" />
                <path d="M54 78l5-3" opacity=".4" />
              </g>
              <Lamp x={48} y={139} active={active} />
              <circle cx="63" cy="139" r="3" fill="#ec9076" />
              <path d="M107 138h26m-26 6h26" strokeWidth="2" />
            </Shell>
            <path d="M43 158h94l12 13H31Z" fill="#d9d8eb" />
            <path d="M49 163h71m-58 4h51" strokeWidth="2" />
          </>
        )}
        {kind === "search" && (
          <>
            <Feet />
            <Shell fill="#accba8" side="#80a58b" top="#cde0bc" y={47} h={103}>
              <rect
                x="40"
                y="59"
                width="103"
                height="68"
                rx="5"
                fill="#f6f6e9"
              />
              <path d="M41 74h101" />
              <circle cx="49" cy="67" r="1.5" fill="#ed9274" stroke="none" />
              <circle cx="56" cy="67" r="1.5" fill="#eccd73" stroke="none" />
              <circle cx="63" cy="67" r="1.5" fill="#8fb895" stroke="none" />
              <rect
                x="51"
                y="84"
                width="79"
                height="16"
                rx="8"
                fill="#e5ead7"
              />
              <circle cx="61" cy="91" r="3" strokeWidth="1.5" />
              <path d="M64 94l3 3M74 92h35" strokeWidth="1.5" />
              <path d="M52 109h42m-42 7h63" stroke="#97a597" strokeWidth="2" />
              <Lamp x={46} y={139} active={active} />
              <path d="M112 138h22m-22 5h22" strokeWidth="1.5" />
            </Shell>
            <path d="M63 155h56l8 12H55Z" fill="#bad3b3" />
            <g className="search-glass">
              <circle
                cx="156"
                cy="112"
                r="19"
                fill="#e9f0d3"
                fillOpacity=".8"
              />
              <path d="M169 127l17 19" strokeWidth="8" />
              <path d="M147 105q5-7 12-3" stroke="#fff" strokeWidth="3" />
            </g>
          </>
        )}
        {kind === "memory" && (
          <>
            <Feet />
            <Shell fill="#edce79" side="#cfab58" top="#f6df9c" y={38} h={115}>
              <Screw x={37} y={45} />
              <Screw x={147} y={45} />
              {[0, 1, 2].map((n) => (
                <g key={n} className={n === 1 ? "memory-drawer" : ""}>
                  <rect
                    x="40"
                    y={51 + n * 31}
                    width="104"
                    height="26"
                    rx="2"
                    fill={n === 1 ? "#f7df9a" : "#f0d48a"}
                  />
                  <rect
                    x="77"
                    y={58 + n * 31}
                    width="28"
                    height="10"
                    rx="2"
                    fill="#fff5d9"
                  />
                  <path d={`M85 ${73 + n * 31}h12`} strokeWidth="2" />
                </g>
              ))}
            </Shell>
            <path d="M59 24l9-11h52l14 14" fill="#c6d5ad" />
            <path d="M59 24h68v15H59Z" fill="#f7f0d8" />
          </>
        )}
        {kind === "gmail" && (
          <>
            <path d="M90 130v37h20v-37" fill="#b28d6f" />
            <path d="M69 170h62" />
            <path d="M28 80q0-39 39-39h71q35 0 35 39v54H28Z" fill="#e6a39b" />
            <path d="M28 80q0-39 39-39t39 39v54H28Z" fill="#f2b6a7" />
            <path d="M36 82q0-29 31-29t31 29v44H36Z" fill="#916c64" />
            <g className="mail-envelope">
              <path d="M42 82h50v35H42Z" fill="#fff6e4" />
              <path
                d="M43 83l24 18 25-18M43 116l16-17m33 17-17-17"
                strokeWidth="1.5"
              />
            </g>
            <path d="M29 132h77l-10 18H18Z" fill="#e7a194" />
            <path d="M145 88V29h23v19h-21" fill="#dd6f54" />
            <circle cx="146" cy="88" r="5" fill="#efd580" />
          </>
        )}
        {kind === "reader" && (
          <>
            <Feet />
            <Shell fill="#eaa68b" side="#c68473" top="#f7c6a5" y={73} h={78}>
              <rect
                x="41"
                y="87"
                width="101"
                height="11"
                rx="3"
                fill="#635d51"
              />
              <Lamp x={47} y={134} active={active} />
              <path d="M115 130h20m-20 6h20" strokeWidth="1.5" />
            </Shell>
            <g className="reader-page">
              <path d="M58 92V24h60l16 16v52Z" fill="#fffae9" />
              <path d="M118 24v17h16" fill="#eadfc3" />
              <path
                d="M70 45h33m-33 9h48m-48 10h48m-48 10h30"
                stroke="#9a9e82"
                strokeWidth="2"
              />
              <rect
                x="68"
                y="60"
                width="53"
                height="9"
                fill="#edcd75"
                fillOpacity=".55"
                stroke="none"
              />
            </g>
            <path d="M53 110h78v12H53Z" fill="#f4c3a0" />
            <path d="M63 116h54" strokeWidth="1.5" />
          </>
        )}
        {kind === "output" && (
          <>
            <Feet />
            <Shell fill="#a9c9be" side="#7ea69e" top="#c9dfd0" y={76} h={77}>
              <path d="M51 91h81v13H51Z" fill="#52695d" />
              <Lamp x={46} y={138} active={active} />
              <circle cx="133" cy="136" r="6" fill="#edcc73" />
            </Shell>
            <path d="M54 77V30h79l12 47" fill="#fffae9" />
            <path
              d="M65 43h54m-54 9h54m-54 9h31"
              stroke="#9ca78e"
              strokeWidth="2"
            />
            <g className="output-paper">
              <path
                d="M53 98h79v62q-12 12-25 5H44q10-10 9-22Z"
                fill="#fff9e7"
              />
              <path
                d="M68 115l4 4 8-9m6 6h33m-51 17 4 4 8-9m6 6h30m-48 16h42"
                stroke="#668875"
                strokeWidth="2"
              />
            </g>
          </>
        )}
        {kind === "task" && (
          <>
            <path d="M41 53l113-8 9 111-113 8Z" fill="#d6b66b" />
            <path d="M35 43l114-9 9 117-114 9Z" fill="#f7df97" />
            <path d="M78 38l-1-10q0-9 10-9t10 9v9" fill="#e9e3cf" />
            <path d="M68 34l39-3 1 12-39 3Z" fill="#f6f0dc" />
            <path
              d="M57 70l4 5 7-10m9 4 45-4M59 93l4 5 7-10m9 4 45-4M62 116l4 5 7-10m9 4 26-2"
              stroke="#7e8059"
              strokeWidth="2"
            />
            <path d="M134 124l27-66 8 4-27 66-8 7Z" fill="#eb8c6c" />
            <path d="M134 124l8 4-8 7Z" fill="#f8f0d9" />
          </>
        )}
      </g>
    </svg>
  );
}
