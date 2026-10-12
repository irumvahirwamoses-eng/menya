import {
  MessagesSquare,
  EarOff,
  MicOff,
  EyeOff,
  Brain,
} from "lucide-react";

export const ACCESS_MODES = {
  standard: {
    id: "standard",
    label: "Standard",
    longLabel: "No accessibility needs",
    tagline: "Text chat with optional voice",
    description:
      "A comfortable default experience: type messages, use voice input if you like, and get optional read-aloud.",
    icon: MessagesSquare,
    chip: "bg-surface-2 text-ink border-line",
    dot: "bg-muted",
  },
  deaf: {
    id: "deaf",
    label: "Deaf / Hard of hearing",
    longLabel: "Deaf or hard of hearing",
    tagline: "ASL avatar + live captions",
    description:
      "Incoming messages are signed by an ASL avatar and shown as large, high-clarity captions.",
    icon: EarOff,
    chip: "bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800",
    dot: "bg-sky-600",
    accent: "text-sky-700 dark:text-sky-300",
  },
  speech: {
    id: "speech",
    label: "Speech impairment",
    longLabel: "Speech or vocal impairment",
    tagline: "Type — the app speaks for you",
    description:
      "You type your reply; the app reads it aloud in a natural voice so the other person hears you.",
    icon: MicOff,
    chip: "bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950 dark:text-violet-100 dark:border-violet-800",
    dot: "bg-violet-600",
    accent: "text-violet-700 dark:text-violet-300",
  },
  blind: {
    id: "blind",
    label: "Blind / Low vision",
    longLabel: "Blind or low vision",
    tagline: "Voice in, voice out",
    description:
      "Messages are read aloud automatically, and you can reply with your voice. Built for screen readers.",
    icon: EyeOff,
    chip: "bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800",
    dot: "bg-teal-600",
    accent: "text-teal-700 dark:text-teal-300",
  },
  cognitive: {
    id: "cognitive",
    label: "Cognitive / Learning",
    longLabel: "Cognitive or learning disability",
    tagline: "Simple words + picture symbols",
    description:
      "Messages appear in simpler language with picture symbols, plus quick phrase buttons to reply fast.",
    icon: Brain,
    chip: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
    dot: "bg-amber-600",
    accent: "text-amber-700 dark:text-amber-300",
  },
};

export const ACCESS_MODE_LIST = Object.values(ACCESS_MODES);

export const QUICK_PHRASES = [
  "Hello!",
  "How are you?",
  "Yes",
  "No",
  "Thank you",
  "Please say that again",
  "I need more time",
  "Can we take a break?",
  "Goodbye",
];

export const SIMPLE_REPLACEMENTS = [
  [/\bassist(ed|ance|ing)?\b/gi, "help"],
  [/\butilize\b/gi, "use"],
  [/\bcommence\b/gi, "start"],
  [/\bendeavou?r\b/gi, "try"],
  [/\bpurchase\b/gi, "buy"],
  [/\brequire(d|s)?\b/gi, "need"],
  [/\bprovide\b/gi, "give"],
  [/\bpurchase\b/gi, "buy"],
  [/\bprior to\b/gi, "before"],
  [/\bcurrently\b/gi, "now"],
  [/\bin addition\b/gi, "also"],
  [/\bat this point in time\b/gi, "now"],
  [/\bapproximately\b/gi, "about"],
  [/\bnumerous\b/gi, "many"],
  [/\badditional\b/gi, "more"],
  [/\bchild(?:ren)?\b/gi, "kid"],
  [/\bphysician\b/gi, "doctor"],
  [/\breside\b/gi, "live"],
  [/\brequirement\b/gi, "rule"],
  [/\bfunction\b/gi, "work"],
  [/\bassistance\b/gi, "help"],
];

export function simplifyText(text) {
  let out = text;
  for (const [pattern, replacement] of SIMPLE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export const THEME_STORAGE_KEY = "sharinga:display";
