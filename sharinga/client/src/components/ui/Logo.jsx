export function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M8 13.5V7.8a1.3 1.3 0 0 1 2.6 0v4.2m0-1.1a1.3 1.3 0 1 1 2.6 0v1.9m0-.9a1.3 1.3 0 1 1 2.6 0v1.6m0-.6a1.3 1.3 0 1 1 2.6 0v3.1c0 3-2.4 5.4-5.4 5.4h-.9c-2 0-3.8-1-4.9-2.7L4.6 15a1.4 1.4 0 0 1 2.2-1.7l1.2 1.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">
        Sharinga
        <span className="ml-1.5 align-middle text-[0.65rem] font-semibold uppercase tracking-wider text-brand">
          Access
        </span>
      </span>
    </span>
  );
}
