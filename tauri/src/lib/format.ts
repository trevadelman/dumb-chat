import { Marked } from "marked";
import DOMPurify from "dompurify";
import type { ChatMessage, UserName } from "./types";

type FirestoreTimestamp = { toDate: () => Date } | null | undefined;

export function toDate(timestamp: FirestoreTimestamp | number): Date {
  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === "number") return new Date(timestamp);
  return new Date();
}

export function formatTime(message: ChatMessage): string {
  const date = toDate(message.timestamp ?? message.clientTimestamp);
  return date.toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function formatDateSeparator(message: ChatMessage): string {
  const date = toDate(message.timestamp ?? message.clientTimestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function sameDay(a: ChatMessage, b: ChatMessage): boolean {
  const da = toDate(a.timestamp ?? a.clientTimestamp);
  const dbb = toDate(b.timestamp ?? b.clientTimestamp);
  return da.toDateString() === dbb.toDateString();
}

export function avatarFor(username: UserName): string {
  return username === "Trevor" ? "T" : "K";
}

export function otherUser(username: UserName): UserName {
  return username === "Trevor" ? "Kyle" : "Trevor";
}

/** Shorten a URL to a compact, readable chip label. */
function linkLabel(url: string): string {
  let rest = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const slash = rest.indexOf("/");
  if (slash === -1) return rest;
  const host = rest.slice(0, slash);
  const path = rest.slice(slash);
  const shortPath = path.length > 20 ? path.slice(0, 18) + "…" : path;
  return host + shortPath;
}

// Configure a Marked instance with GitHub-flavored markdown and single-line
// breaks (chat messages treat a newline as a hard break, like iMessage/Slack).
const marked = new Marked({ gfm: true, breaks: true });

// Render links as our compact chips and tag them for the external-open
// click handler instead of emitting plain anchors.
marked.use({
  renderer: {
    link({ href, title, text }) {
      const safeHref = href ?? "#";
      const titleAttr = title ?? safeHref;
      const label = text && text !== href ? text : linkLabel(safeHref);
      return `<a href="#" data-url="${safeHref}" class="external-link link-chip" title="${titleAttr}">🔗 ${label}</a>`;
    },
    code({ text }) {
      return `<pre class="code-block"><code>${escapeHtml(text)}</code></pre>`;
    },
    codespan({ text }) {
      return `<code class="inline-code">${text}</code>`;
    },
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const level = Math.min(depth, 3);
      return `<h${level} class="md-h${level}">${inner}</h${level}>`;
    },
  },
});

/** Minimal HTML escape used inside our custom code renderer. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render GitHub-flavored markdown to sanitized HTML. Parsing is delegated to
 * `marked`; the output is run through DOMPurify before it reaches `{@html}`.
 * Links keep our compact chip styling and `data-url` hook for native opening.
 */
export function renderMarkdown(text: string | undefined): string {
  if (!text) return "";
  const raw = marked.parse(text, { async: false });
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["data-url", "target"],
  });
}



export interface RenderItem {
  type: "separator" | "message";
  /** for separator */
  label?: string;
  /** for message */
  message?: ChatMessage;
  isFirstInGroup?: boolean;
}

/**
 * Build a flat render list with date separators and grouping flags,
 * replacing the old imperative lastDate/lastUsername tracking.
 */
export function buildRenderItems(messages: ChatMessage[]): RenderItem[] {
  const items: RenderItem[] = [];
  let prev: ChatMessage | null = null;
  let groupResetBySeparator = false;

  for (const message of messages) {
    const needsSeparator = !prev || !sameDay(prev, message);
    if (needsSeparator) {
      items.push({ type: "separator", label: formatDateSeparator(message) });
      groupResetBySeparator = true;
    }

    const isFirstInGroup =
      groupResetBySeparator || !prev || prev.username !== message.username;

    items.push({ type: "message", message, isFirstInGroup });

    prev = message;
    groupResetBySeparator = false;
  }

  return items;
}
