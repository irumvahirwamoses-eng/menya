import { Loader2 } from "lucide-react";

export default function Spinner({ label = "Loading", className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 text-muted ${className}`} role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </span>
  );
}
