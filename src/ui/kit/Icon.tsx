const PATHS: Record<string, string> = {
  up: "M12 19V5m0 0l-6 6m6-6l6 6",
  down: "M12 5v14m0 0l6-6m-6 6l-6-6",
  left: "M15 19l-7-7 7-7",
  right: "M9 5l7 7-7 7",
  close: "M6 6l12 12M18 6L6 18",
  copy: "M8 8h10v12H8zM6 16H4V4h10v2",
  trash: "M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3",
  plus: "M12 5v14m-7-7h14",
  undo: "M9 14L4 9l5-5M4 9h10a6 6 0 016 6v1",
  redo: "M15 14l5-5-5-5m5 5H10a6 6 0 00-6 6v1",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  page: "M7 3h7l5 5v13H7zM14 3v5h5",
  drag: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  check: "M5 13l4 4L19 7",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z",
  logo: "M6 4h9a3 3 0 013 3v13H9a3 3 0 01-3-3zM6 4v13M18 9h-6",
};

export function Icon({
  name,
  size = 15,
  className = "",
  strokeWidth = 1.8,
}: {
  name: keyof typeof PATHS | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name] ?? ""} />
    </svg>
  );
}
