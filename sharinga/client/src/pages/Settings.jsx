import { useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Contrast,
  Type,
  Volume2,
  Hand,
  Accessibility,
  Save,
  RotateCcw,
  Zap,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import ModeBadge from "../components/ui/ModeBadge";
import { useAuth } from "../context/AuthContext";
import { useDisplay } from "../context/DisplayContext";
import { useTTS } from "../hooks/useTTS";
import { ACCESS_MODE_LIST } from "../lib/constants";


const Section = ({ icon, title, description, children }) => {
  const SectionIcon = icon;
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">
          <SectionIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ChoiceRow({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`btn !min-h-11 gap-2 ${
              selected ? "btn-primary" : "btn-secondary"
            }`}
          >
            {opt.icon && <opt.icon className="h-4 w-4" aria-hidden="true" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { settings, update, reset } = useDisplay();
  const { speak, supported: ttsSupported } = useTTS();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");


  const saveMode = async (accessMode) => {
    setSaving(true);
    setError("");
    try {
      await updateProfile({ accessMode });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };



  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="animate-rise mb-8">
          <div className="flex items-center gap-3">
            <Accessibility className="h-7 w-7 text-brand" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">
              Accessibility settings
            </h1>
          </div>
          <p className="mt-2 text-muted">
            Tune Sharinga to how you communicate best. Changes apply instantly.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Section
            icon={Hand}
            title="Communication mode"
            description="This decides how messages are rendered for you and what tools you get."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {ACCESS_MODE_LIST.map((mode) => {
                const Icon = mode.icon;
                const selected = user?.accessMode === mode.id;
                return (
                  <label
                    key={mode.id}
                    className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors ${
                      selected
                        ? "border-brand bg-brand-soft"
                        : "border-line bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      className="sr-only"
                      checked={selected}
                      onChange={() => saveMode(mode.id)}
                    />
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-xl ${
                          selected ? "bg-brand text-white" : "bg-surface-2 text-muted"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </span>
                      <span className="font-bold text-ink">{mode.label}</span>
                    </span>
                    <span className="text-sm leading-snug text-muted">
                      {mode.description}
                    </span>
                    {selected && <ModeBadge mode={mode} className="self-start" />}
                  </label>
                );
              })}
            </div>
            {error && (
              <p className="field-error mt-3" role="alert">
                {error}
              </p>
            )}
            {saved && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success">
                <Save className="h-4 w-4" aria-hidden="true" /> Mode updated
              </p>
            )}
          </Section>

          <Section
            icon={Type}
            title="Reading comfort"
            description="Bigger text and stronger contrast, applied everywhere in the app."
          >
            <div className="flex flex-col gap-5">
              <div>
                <p className="field-label">Text size</p>
                <ChoiceRow
                  label="Text size"
                  value={settings.textSize}
                  onChange={(textSize) => update({ textSize })}
                  options={[
                    { value: "md", label: "Default" },
                    { value: "lg", label: "Large" },
                    { value: "xl", label: "Extra large" },
                  ]}
                />
              </div>

              <div>
                <p className="field-label">Theme</p>
                <ChoiceRow
                  label="Theme"
                  value={settings.theme}
                  onChange={(theme) => update({ theme })}
                  options={[
                    { value: "system", label: "System", icon: Monitor },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                  ]}
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => update({ highContrast: e.target.checked })}
                  className="mt-0.5 h-5 w-5 rounded accent-[var(--color-brand)]"
                />
                <span>
                  <span className="flex items-center gap-2 font-bold text-ink">
                    <Contrast className="h-4 w-4" aria-hidden="true" />
                    High contrast mode
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    Pure black/white text, thick borders — for low vision.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4">
                <input
                  type="checkbox"
                  checked={settings.reduceMotion}
                  onChange={(e) => update({ reduceMotion: e.target.checked })}
                  className="mt-0.5 h-5 w-5 rounded accent-[var(--color-brand)]"
                />
                <span>
                  <span className="flex items-center gap-2 font-bold text-ink">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    Reduce motion
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">
                    Removes animations for comfort.
                  </span>
                </span>
              </label>
            </div>
          </Section>

          <Section
            icon={Volume2}
            title="Voice"
            description="Automatic read-aloud for incoming messages."
          >
            <label className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2 p-4">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => update({ autoSpeak: e.target.checked })}
                className="mt-0.5 h-5 w-5 rounded accent-[var(--color-brand)]"
              />
              <span>
                <span className="font-bold text-ink">Read incoming messages aloud</span>
                <span className="mt-0.5 block text-sm text-muted">
                  The newest message from your partner is spoken automatically.
                </span>
              </span>
            </label>

            <Button
              variant="secondary"
              className="mt-4"
              disabled={!ttsSupported}
              onClick={() =>
                speak("Hello! This is how Sharinga will read messages to you.")
              }
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              Preview voice
            </Button>
            {!ttsSupported && (
              <p className="field-hint">
                Voice output isn’t supported in this browser — Chrome or Edge work best.
              </p>
            )}
          </Section>



          <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
            <div>
              <p className="font-bold text-ink">Reset to defaults</p>
              <p className="text-sm text-muted">
                Restores theme, text size and voice preferences.
              </p>
            </div>
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
