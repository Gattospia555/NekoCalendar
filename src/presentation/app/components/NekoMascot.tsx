/**
 * Neko, la mascotte della famiglia Neko: lo stesso gatto arancione di NekoTune
 * (src/js/ui/mascot.js di NekoTune, licenza MIT, © CatDevStudio), qui in versione React.
 *
 * Differenza voluta: in NekoCalendar Neko sta fermo. Si muove solo quando lo si
 * accarezza (clic) o gli si passa sopra con il mouse, e per poco: a riposo nessuna
 * animazione, così il consumo resta zero.
 */

/** Umore di Neko: decide occhi, coda e il piccolo segno accanto (cuore, zzz, punto di domanda). */
export type NekoMood = "awake" | "happy" | "sleepy" | "curious";

const C = {
  fill: "#FFB37E",
  line: "#F28A5B",
  ink: "#2B1D16",
  whisker: "#B5654A",
  blush: "#FF8F7A",
  lilac: "#BCA0DC",
  lilacDark: "#9B7FC4",
  pink: "#FFB6C1",
};

/** Sagoma della testa con le orecchie (la stessa del logo e del giorno di oggi). */
export const NEKO_HEAD_PATH =
  "M58 118 C54 92 64 74 78 66 L82 34 L108 56 C116 54 128 54 136 56 L162 34 L166 66 C180 74 190 92 186 118 C182 146 156 162 122 162 C88 162 62 146 58 118 Z";

const TAIL_REST =
  "M150 228 L157 228.9 L163.5 229.4 L169.6 229.3 L175.3 228.7 L180.4 227.7 L185.1 226.3 L189.3 224.4 L193 222.2 L196.2 219.5 L198.8 216.6 L200.9 213.3 L202.4 209.7 L203.4 205.8 L203.8 201.6 L203.6 197.2 L203 193.6 L202.4 190.1 L201.7 186.6 L200.9 183.3 L200.1 179.9 L199.4 176.6 L198.6 173.3 L197.9 170.1 L197.3 166.8 L196.8 163.5 L196.4 160.1 L196.2 156.7 L196.1 153.2 L196.2 149.6 L196.5 145.9 L197 143.1 L197.7 140.5 L198.6 138.1 L199.8 136 L201.1 134 L202.6 132.3 L204.3 130.9 L206.1 129.7 L208.1 128.7 L210.1 128 L212.2 127.6 L214.4 127.4 L216.7 127.6 L218.9 128 L221.2 128.7 L223.4 129.7 L225.3 131 L227.1 132.5 L228.7 134.2 L230 136.1 L231.2 138.1 L232 140.3 L232.7 142.5 L233.1 144.9 L233.2 147.3 L233 149.8 L232.6 152.3 L231.9 154.8 L230.8 157.2 L229.5 159.6 L228.7 160.8 L227.9 161.8 L227 162.8 L226.1 163.6 L225.1 164.4 L224.2 165.1 L223.1 165.7 L222.1 166.2 L221 166.6 L219.9 166.9 L218.9 167.2 L217.8 167.3 L216.7 167.4 L215.6 167.4 L214.5 167.3";
const CURLED_TAIL = "M168 230 C196 232 204 246 184 251 C154 257 98 256 72 250";
const BODY =
  "M80 236 C64 236 60 212 64 194 C70 166 86 148 122 148 C158 148 174 166 180 194 C184 212 180 236 164 236 Z";

const outline = {
  stroke: C.line,
  strokeWidth: 6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Eyes({ kind }: { kind: "open" | "happy" | "sleep" | "side" }) {
  const xs = [100, 144];
  const y = 112;
  if (kind === "open" || kind === "side") {
    const dx = kind === "side" ? 5 : 0;
    const dy = kind === "side" ? -2 : 0;
    return (
      <g className="neko-eyes">
        {xs.map((x) => (
          <g key={x}>
            <circle cx={x + dx} cy={y + dy} r={6} fill={C.ink} />
            <circle
              cx={x + dx + (kind === "side" ? 1.5 : -1.8)}
              cy={y + dy - 1.8}
              r={1.9}
              fill="#fff"
            />
          </g>
        ))}
      </g>
    );
  }
  const curve = (x: number) =>
    kind === "sleep"
      ? `M${x - 8} ${y} Q${x} ${y + 7} ${x + 8} ${y}`
      : `M${x - 8} ${y + 3} Q${x} ${y - 7} ${x + 8} ${y + 3}`;
  return (
    <g>
      {xs.map((x) => (
        <path
          key={x}
          d={curve(x)}
          fill="none"
          stroke={C.ink}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function Head({ eyes }: { eyes: "open" | "happy" | "sleep" | "side" }) {
  return (
    <g className={`neko-head${eyes === "sleep" ? " neko-head--sleep" : ""}`}>
      <path d={NEKO_HEAD_PATH} fill={C.fill} {...outline} />
      <Eyes kind={eyes} />
      <path
        d="M118 122 L126 122 L122 126 Z"
        fill={C.ink}
        stroke={C.ink}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d={
          eyes === "side"
            ? "M116 129 Q122 126 128 129"
            : "M113 128 Q117.5 134 122 128 Q126.5 134 131 128"
        }
        fill="none"
        stroke={C.ink}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={86} cy={130} r={5} fill={C.blush} opacity={0.45} />
      <circle cx={158} cy={130} r={5} fill={C.blush} opacity={0.45} />
      <path
        d="M78 121 L56 117 M78 128 L56 131 M166 121 L188 117 M166 128 L188 131"
        stroke={C.whisker}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </g>
  );
}

function Tail() {
  return (
    <g className="neko-tail">
      <path
        d={TAIL_REST}
        fill="none"
        stroke={C.line}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={TAIL_REST}
        fill="none"
        stroke={C.fill}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={214.5} cy={167.3} r={9} fill={C.line} />
    </g>
  );
}

function CurledTail() {
  return (
    <g>
      <path d={CURLED_TAIL} fill="none" stroke={C.line} strokeWidth={16} strokeLinecap="round" />
      <path d={CURLED_TAIL} fill="none" stroke={C.fill} strokeWidth={5} strokeLinecap="round" />
      <circle cx={70} cy={249} r={9} fill={C.line} />
    </g>
  );
}

const Heart = () => (
  <path
    className="neko-extra"
    d="M34 78 C16 64 19 46 29 46 C33.5 46 34 51 34 51 C34 51 34.5 46 39 46 C49 46 52 64 34 78 Z"
    fill={C.pink}
    stroke="#F28AA0"
    strokeWidth={3}
    strokeLinejoin="round"
  />
);

const Zzz = () => (
  <g className="neko-extra" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M196 70 h16 l-16 18 h16" stroke={C.lilacDark} strokeWidth={3.6} />
    <path d="M216 38 h11 l-11 12 h11" stroke={C.lilac} strokeWidth={3} />
  </g>
);

const Question = () => (
  <g className="neko-extra">
    <path
      d="M196 48 C196 34 218 34 218 48 C218 58 207 59 207 70"
      fill="none"
      stroke={C.lilacDark}
      strokeWidth={4.5}
      strokeLinecap="round"
    />
    <circle cx={207} cy={82} r={3.4} fill={C.lilacDark} />
  </g>
);

/** Il gatto intero, seduto, nell'umore richiesto. Decorativo: il testo lo porta il fumetto. */
export function NekoMascot({ mood, size = 110 }: { mood: NekoMood; size?: number }) {
  const eyes = { awake: "open", happy: "happy", sleepy: "sleep", curious: "side" } as const;
  return (
    <svg
      className={`neko-mascot neko-mascot--${mood}`}
      viewBox="0 0 260 262"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx={124} cy={242} rx={84} ry={6} fill={C.line} opacity={0.14} />
      {mood !== "sleepy" && <Tail />}
      <path d={BODY} fill={C.fill} {...outline} />
      <path d="M106 196 L106 230 M138 196 L138 230" fill="none" {...outline} />
      <ellipse cx={104} cy={234} rx={14} ry={8} fill={C.fill} {...outline} />
      <ellipse cx={140} cy={234} rx={14} ry={8} fill={C.fill} {...outline} />
      {mood === "sleepy" && <CurledTail />}
      <Head eyes={eyes[mood]} />
      {mood === "happy" && <Heart />}
      {mood === "sleepy" && <Zzz />}
      {mood === "curious" && <Question />}
    </svg>
  );
}
