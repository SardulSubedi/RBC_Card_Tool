import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 28, children, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Cart: (p: Props) => (
    <Base {...p}>
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </Base>
  ),
  Warehouse: (p: Props) => (
    <Base {...p}>
      <path d="M3 10l9-6 9 6v10H3z" />
      <path d="M7 20v-7h10v7M7 16.5h10" />
    </Base>
  ),
  Dining: (p: Props) => (
    <Base {...p}>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M16 3c-1.7 0-3 2.2-3 5s1.3 4 3 4v9M16 3v9" />
    </Base>
  ),
  Fuel: (p: Props) => (
    <Base {...p}>
      <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M4 21h12M5 11h10" />
      <path d="M15 8h2a2 2 0 0 1 2 2v6.5a1.5 1.5 0 0 0 3 0V9l-2-2" />
    </Base>
  ),
  Plug: (p: Props) => (
    <Base {...p}>
      <path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 0 1-10 0z" />
      <path d="M12 16v5" />
    </Base>
  ),
  Transit: (p: Props) => (
    <Base {...p}>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 10h14M9 17l-1.5 3M15 17l1.5 3" />
      <circle cx="9" cy="13.5" r="0.9" fill="currentColor" />
      <circle cx="15" cy="13.5" r="0.9" fill="currentColor" />
    </Base>
  ),
  Car: (p: Props) => (
    <Base {...p}>
      <path d="M4 13l1.8-5A2 2 0 0 1 7.7 6.5h8.6a2 2 0 0 1 1.9 1.5L20 13" />
      <path d="M3 13h18v4.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17H6.5v.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <circle cx="7.5" cy="15" r="0.9" fill="currentColor" />
      <circle cx="16.5" cy="15" r="0.9" fill="currentColor" />
    </Base>
  ),
  Plane: (p: Props) => (
    <Base {...p}>
      <path d="M10.5 13.5L4 11l1.5-1.5 6.5 1 5-5a1.6 1.6 0 0 1 2.3 2.3l-5 5 1 6.5L13.8 21l-2.5-6.5" />
      <path d="M6.5 17.5L5 19" />
    </Base>
  ),
  Screen: (p: Props) => (
    <Base {...p}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4M10 8.5l4 1.5-4 1.5z" fill="currentColor" />
    </Base>
  ),
  Gamepad: (p: Props) => (
    <Base {...p}>
      <path d="M7 8h10a4 4 0 0 1 4 4l-.8 4.3a2 2 0 0 1-3.6.8L15 15H9l-1.6 2.1a2 2 0 0 1-3.6-.8L3 12a4 4 0 0 1 4-4z" />
      <path d="M8 11v3M6.5 12.5h3" />
      <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" />
      <circle cx="17.5" cy="13" r="0.8" fill="currentColor" />
    </Base>
  ),
  Receipt: (p: Props) => (
    <Base {...p}>
      <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z" />
      <path d="M9 8h6M9 11.5h6M9 15h4" />
    </Base>
  ),
  Bag: (p: Props) => (
    <Base {...p}>
      <path d="M5 8h14l-1 12H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Base>
  ),
  Tag: (p: Props) => (
    <Base {...p}>
      <path d="M3 12V4h8l9 9-8 8z" />
      <circle cx="7.5" cy="8.5" r="1.2" fill="currentColor" />
    </Base>
  ),
  Wallet: (p: Props) => (
    <Base {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h13v3" />
      <path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z" />
      <circle cx="16.5" cy="14" r="1" fill="currentColor" />
    </Base>
  ),
  Card: (p: Props) => (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M7 15h4" />
    </Base>
  ),
  Coins: (p: Props) => (
    <Base {...p}>
      <ellipse cx="9" cy="7" rx="6" ry="2.5" />
      <path d="M3 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" />
      <path d="M3 11v4c0 1.4 2.7 2.5 6 2.5 1 0 2-.1 2.8-.3" />
      <ellipse cx="16" cy="15" rx="5" ry="2" />
      <path d="M11 15v3c0 1.1 2.2 2 5 2s5-.9 5-2v-3" />
    </Base>
  ),
  Star: (p: Props) => (
    <Base {...p}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8z" />
    </Base>
  ),
  Shield: (p: Props) => (
    <Base {...p}>
      <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  ),
  Lock: (p: Props) => (
    <Base {...p}>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Base>
  ),
  Scale: (p: Props) => (
    <Base {...p}>
      <path d="M12 3v18M5 21h14M12 6l-6 2 6-2 6 2" />
      <path d="M3 13l3-5 3 5a3 3 0 0 1-6 0zM15 13l3-5 3 5a3 3 0 0 1-6 0z" />
    </Base>
  ),
  Upload: (p: Props) => (
    <Base {...p}>
      <path d="M12 16V5M7.5 9.5L12 5l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </Base>
  ),
  Question: (p: Props) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" />
    </Base>
  ),
  Pencil: (p: Props) => (
    <Base {...p}>
      <path d="M4 20l4-1 10.5-10.5a1.5 1.5 0 0 0 0-2.1l-.9-.9a1.5 1.5 0 0 0-2.1 0L5 16z" />
      <path d="M14 7l3 3" />
    </Base>
  ),
  Check: (p: Props) => (
    <Base {...p}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  ),
  ArrowLeft: (p: Props) => (
    <Base {...p}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Base>
  ),
  ChevronLeft: (p: Props) => (
    <Base {...p}>
      <path d="M15 6l-6 6 6 6" />
    </Base>
  ),
  ChevronRight: (p: Props) => (
    <Base {...p}>
      <path d="M9 6l6 6-6 6" />
    </Base>
  ),
  Pause: (p: Props) => (
    <Base {...p}>
      <path d="M8 5v14M16 5v14" />
    </Base>
  ),
  Play: (p: Props) => (
    <Base {...p}>
      <path d="M7 5l12 7-12 7z" />
    </Base>
  ),
};
