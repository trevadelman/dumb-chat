// Lightweight client-side spell checker built on nspell + a Hunspell English
// dictionary. The native WKWebView continuous-underline isn't reachable from
// Tauri/wry, so we draw our own red squiggles in an overlay (see ChatInput).
//
// The dictionary `.aff`/`.dic` files are imported as raw strings via Vite so
// they get bundled and work in the browser (the `dictionary-en` entry point
// relies on `node:fs`, which is unavailable in the webview).
import nspell from "nspell";
import affRaw from "../../node_modules/dictionary-en/index.aff?raw";
import dicRaw from "../../node_modules/dictionary-en/index.dic?raw";

export interface Misspelling {
  word: string;
  start: number;
  end: number;
}

let checker: ReturnType<typeof nspell> | null = null;
let loading: Promise<void> | null = null;

// Matches runs of word characters including apostrophes (e.g. "don't").
const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)*/g;

// Words shorter than this are skipped (e.g. "a", "I", initials).
const MIN_LENGTH = 2;

/** Lazily build the nspell instance. Safe to call repeatedly. */
export function loadSpellChecker(): Promise<void> {
  if (loading) return loading;
  loading = new Promise<void>((resolve) => {
    checker = nspell(affRaw, dicRaw);
    resolve();
  });
  return loading;
}

/** Returns true once the dictionary is ready. */
export function isReady(): boolean {
  return checker !== null;
}

/**
 * Finds misspelled words in `text`, returning their character ranges so the
 * overlay can position underlines. Returns an empty array until the dictionary
 * has loaded.
 */
export function findMisspellings(text: string): Misspelling[] {
  if (!checker) return [];

  const results: Misspelling[] = [];
  for (const match of text.matchAll(WORD_RE)) {
    const word = match[0];
    const start = match.index ?? 0;
    if (word.length < MIN_LENGTH) continue;
    // Skip all-numeric or words that contain digits handled by WORD_RE already.
    if (checker.correct(word)) continue;
    results.push({ word, start, end: start + word.length });
  }
  return results;
}

/** Returns up to `limit` suggestions for a misspelled word. */
export function suggest(word: string, limit = 5): string[] {
  if (!checker) return [];
  return checker.suggest(word).slice(0, limit);
}
