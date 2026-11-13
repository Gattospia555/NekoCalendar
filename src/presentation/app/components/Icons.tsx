/**
 * Icone a tratto disegnate per NekoCalendar (nessun set esterno, nessuna licenza da gestire).
 * Sono decorative (`aria-hidden`): il significato lo porta sempre un testo o un `aria-label`.
 */
import type { SVGProps } from "react";

const PATHS = {
  calendar:
    "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M9 3v4M15 3v4",
  list: "M9 7h11M9 12h11M9 17h11M5 7h.01M5 12h.01M5 17h.01",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l5 4.5 9-9.5",
  cloud: "M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z",
  clock: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 7.5V12l3 2",
  pin: "M12 21s6-6 6-11a6 6 0 0 0-12 0c0 5 6 11 6 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  repeat: "M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4",
  cake: "M4 20h16v-7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 16c2 1.5 4-1.5 6 0s4-1.5 6 0 3-.5 4 0M12 11V7M12 4.5V5",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  task: "M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM8 12l3 3 5-6",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Logo del gatto (stesso disegno del mockup e dell'icona dell'app). */
export function CatLogo({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M6 14 L6 4 L13 9 Q16 8 19 9 L26 4 L26 14 Q28 18 26 22 Q22 28 16 28 Q10 28 6 22 Q4 18 6 14 Z"
        fill={color}
      />
      <circle cx="12" cy="17" r="1.8" fill="#ffffff" />
      <circle cx="20" cy="17" r="1.8" fill="#ffffff" />
      <path d="M15 21 L17 21 L16 22.4 Z" fill="#ffc6d6" />
    </svg>
  );
}
