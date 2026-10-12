const VARIANTS = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button type={type} className={`${VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
