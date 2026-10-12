import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { AuthLayout } from "./Login";
import { useAuth } from "../context/AuthContext";
import { ACCESS_MODE_LIST, ACCESS_MODES } from "../lib/constants";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    accessMode: "standard",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/lobby" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/lobby", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Tell us how you communicate best — you can change this anytime."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Field
          label="Your name"
          autoComplete="name"
          placeholder="e.g. Ayesha Khan"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <fieldset>
          <legend className="field-label">How will you use Sharinga?</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ACCESS_MODE_LIST.map((mode) => {
              const Icon = mode.icon;
              const selected = form.accessMode === mode.id;
              return (
                <label
                  key={mode.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                    selected
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-surface hover:bg-surface-2"
                  }`}
                >
                  <input
                    type="radio"
                    name="accessMode"
                    value={mode.id}
                    checked={selected}
                    onChange={() => setForm({ ...form, accessMode: mode.id })}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      selected ? "bg-brand text-white" : "bg-surface-2 text-muted"
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      {mode.label}
                      {selected && <Check className="h-3.5 w-3.5 text-brand" />}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      {mode.tagline}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="field-hint">
            Selected: <strong>{ACCESS_MODES[form.accessMode].longLabel}</strong>
          </p>
        </fieldset>

        <Field
          as="select"
          label="Avatar voice (used when the app speaks for you)"
          value={form.avatarModel || "MALE"}
          onChange={(e) => setForm({ ...form, avatarModel: e.target.value })}
        >
          <option value="MALE">Standard voice A</option>
          <option value="FEMALE">Standard voice B</option>
        </Field>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating account…" : "Create account"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </AuthLayout>
  );
}
