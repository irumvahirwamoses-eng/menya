import { useId } from "react";

export default function Field({
  label,
  hint,
  error,
  className = "",
  as = "input",
  id,
  children,
  ...props
}) {
  const reactId = useId();
  const inputId = id || `field-${reactId}`;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-error`]
    .filter(Boolean)
    .join(" ");

  const Tag = as;

  return (
    <div className={className}>
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <Tag
        id={inputId}
        className="input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      >
        {children}
      </Tag>
      {hint && (
        <p className="field-hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
