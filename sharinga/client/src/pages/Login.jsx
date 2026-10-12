import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { HeartHandshake, ArrowRight, ShieldCheck } from "lucide-react";
import Field from "../components/ui/Field";
import Button from "../components/ui/Button";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.18) 0, transparent 40%)",
          }}
          aria-hidden="true"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
            Inclusive by design
          </span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            One conversation.
            <br />
            Two people, fully understood.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Sharinga bridges people with and without disabilities using an ASL avatar, live
            captions, voice, picture symbols and readable design.
          </p>
        </div>

        <ul className="relative flex flex-wrap gap-3 text-sm font-semibold text-white/90">
          {["ASL avatar", "Voice in / out", "Picture symbols", "High contrast"].map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" aria-label="Sharinga home" className="mb-10 inline-block">
            <Logo />
          </Link>
          <h2 className="text-3xl font-bold text-ink">{title}</h2>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
        </div>
      </section>
    </div>
  );
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/lobby" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate("/lobby", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your conversations."
      footer={
        <>
          New to Sharinga?{" "}
          <Link to="/register" className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
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
          autoComplete="current-password"
          placeholder="Your password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={error || undefined}
        />
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </AuthLayout>
  );
}
