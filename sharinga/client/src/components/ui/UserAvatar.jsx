const PALETTE = [
  "bg-indigo-600",
  "bg-teal-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-sky-600",
];

function hashName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash;
}

export default function UserAvatar({ name = "", size = "md", className = "" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const color = PALETTE[hashName(name) % PALETTE.length];
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-surface ${sizes[size]} ${color} ${className}`}
    >
      {initials || "?"}
    </span>
  );
}
