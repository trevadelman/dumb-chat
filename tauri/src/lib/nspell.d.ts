// Minimal type declarations for the `nspell` package, which ships without its
// own types. Only the surface we use is declared here.
declare module "nspell" {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
    add(word: string): NSpell;
    remove(word: string): NSpell;
  }

  function nspell(aff: string, dic: string): NSpell;
  function nspell(dictionary: { aff: string; dic: string }): NSpell;

  export default nspell;
}

// Raw string imports handled by Vite's `?raw` suffix.
declare module "*?raw" {
  const content: string;
  export default content;
}
