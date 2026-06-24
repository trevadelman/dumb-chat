<script lang="ts">
  import { onMount } from "svelte";
  import {
    loadSpellChecker,
    findMisspellings,
    type Misspelling,
  } from "$lib/spellcheck";

  interface PendingImage {
    data: string;
    type: string;
    sizeMb: number;
  }

  interface Props {
    onSend: (text: string, image: PendingImage | null) => void;
    onStatus: (text: string) => void;
  }

  let { onSend, onStatus }: Props = $props();

  const MAX_MB = 0.75;

  let text = $state("");
  let pendingImage = $state<PendingImage | null>(null);
  let textarea: HTMLTextAreaElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let overlay: HTMLDivElement | undefined = $state();

  // Misspelled ranges for the current text, plus a token list the overlay
  // renders so each bad word can get a red squiggle underline.
  let misspellings = $state<Misspelling[]>([]);
  let scrollTop = $state(0);

  interface Segment {
    text: string;
    bad: boolean;
  }

  // Splits the text into alternating plain/misspelled segments for rendering.
  let segments = $derived.by<Segment[]>(() => {
    if (misspellings.length === 0) return [{ text, bad: false }];
    const out: Segment[] = [];
    let cursor = 0;
    for (const m of misspellings) {
      if (m.start > cursor)
        out.push({ text: text.slice(cursor, m.start), bad: false });
      out.push({ text: text.slice(m.start, m.end), bad: true });
      cursor = m.end;
    }
    if (cursor < text.length)
      out.push({ text: text.slice(cursor), bad: false });
    return out;
  });

  // Re-run spell checking after edits; debounced so typing stays snappy.
  let recheckTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleRecheck() {
    clearTimeout(recheckTimer);
    recheckTimer = setTimeout(() => {
      misspellings = findMisspellings(text);
    }, 150);
  }

  onMount(() => {
    loadSpellChecker().then(() => {
      misspellings = findMisspellings(text);
    });
  });

  function autosize() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function onInput() {
    autosize();
    scheduleRecheck();
  }

  function syncScroll() {
    if (textarea) scrollTop = textarea.scrollTop;
  }


  function send() {
    if (!text.trim() && !pendingImage) return;
    onSend(text.trim(), pendingImage);
    text = "";
    pendingImage = null;
    if (textarea) textarea.style.height = "auto";
  }

  function insertMarkdown(prefix: string, suffix: string) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = text.substring(start, end);
    const replacement = selected
      ? prefix + selected + suffix
      : prefix + "text" + suffix;
    text = text.substring(0, start) + replacement + text.substring(end);
    queueMicrotask(() => {
      if (!textarea) return;
      if (selected) {
        textarea.selectionStart = end + prefix.length + suffix.length;
        textarea.selectionEnd = textarea.selectionStart;
      } else {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length + 4;
      }
      textarea.focus();
    });
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "b") {
      e.preventDefault();
      insertMarkdown("**", "**");
    } else if ((e.ctrlKey || e.metaKey) && e.key === "i") {
      e.preventDefault();
      insertMarkdown("*", "*");
    }
  }

  function readImage(file: File) {
    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > MAX_MB) {
      alert("Image size exceeds 750KB limit. Please use a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      pendingImage = {
        data: event.target?.result as string,
        type: file.type,
        sizeMb,
      };
      onStatus("Connected");
    };
    reader.onerror = () => {
      alert("Error reading image.");
      onStatus("Connected");
    };
    onStatus("Processing image...");
    reader.readAsDataURL(file);
  }

  function onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    readImage(input.files[0]);
    input.value = "";
  }

  function onPaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf("image") === 0) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) readImage(file);
        return;
      }
    }
  }
</script>

{#if pendingImage}
  <div class="image-preview-container">
    <img src={pendingImage.data} alt="Pending attachment" />
    <button class="remove-btn" onclick={() => (pendingImage = null)}>✕</button>
  </div>
{/if}

<div class="chat-input">
  <button
    class="file-upload-btn"
    title="Attach file"
    onclick={() => fileInput?.click()}>📎</button
  >
  <input
    type="file"
    accept="image/*"
    style="display: none;"
    bind:this={fileInput}
    onchange={onFileChange}
  />
  <div class="textarea-wrap">
    <div
      class="spellcheck-overlay"
      bind:this={overlay}
      aria-hidden="true"
      style="transform: translateY({-scrollTop}px);"
    >{#each segments as seg}{#if seg.bad}<span class="misspelled">{seg.text}</span>{:else}{seg.text}{/if}{/each}</div>

    <textarea
      bind:this={textarea}
      bind:value={text}
      placeholder="Type a message..."
      rows="1"
      spellcheck="true"
      oninput={onInput}
      onkeydown={onKeydown}
      onpaste={onPaste}
      onscroll={syncScroll}
    ></textarea>
  </div>

  <button
    class="send-button"
    onclick={send}
    disabled={!text.trim() && !pendingImage}
    aria-label="Send message">➤</button
  >
</div>

<style>
  .chat-input {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 20px;
    background-color: var(--surface-color);
    display: flex;
    gap: 12px;
    border-top: 1px solid var(--border-color);
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  }

  .textarea-wrap {
    flex: 1;
    position: relative;
    display: flex;
  }

  /* Shared box model so the overlay text lines up exactly with the textarea. */
  .chat-input textarea,
  .spellcheck-overlay {
    width: 100%;
    padding: 14px 20px;
    border: 1px solid transparent;
    border-radius: var(--radius-lg);
    font-size: 15px;
    line-height: 1.5;
    font-family: inherit;
    box-sizing: border-box;
    max-height: 120px;
    min-height: 48px;
  }

  .chat-input textarea {
    position: relative;
    z-index: 1;
    border-color: var(--border-color);
    background-color: transparent;
    color: var(--text-color);
    transition: var(--transition);
    resize: none;
    overflow-y: auto;
  }
  .chat-input textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(58, 134, 255, 0.2);
  }

  /* Sits behind the textarea, mirroring its text. Only misspelled words are
     visible (as a red squiggle); everything else is transparent. */
  .spellcheck-overlay {
    position: absolute;
    inset: 0;
    z-index: 0;
    color: transparent;
    background-color: var(--bg-color);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-y: auto;
    overflow-x: hidden;
    pointer-events: none;
    user-select: none;
  }
  .spellcheck-overlay .misspelled {
    /* WebKit (the engine in Tauri's WKWebView) needs the prefixed
       text-decoration longhands; the unprefixed shorthand alone does not
       render the wavy color reliably. */
    -webkit-text-decoration-line: underline;
    -webkit-text-decoration-style: wavy;
    -webkit-text-decoration-color: var(--error-color, #ff5d5d);
    text-decoration-line: underline;
    text-decoration-style: wavy;
    text-decoration-color: var(--error-color, #ff5d5d);
    text-decoration-skip-ink: none;
    text-underline-offset: 2px;
  }



  .send-button {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--bubble-sent-gradient);
    color: white;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .send-button:hover:not(:disabled) {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 14px rgba(58, 134, 255, 0.4);
  }
  .send-button:disabled {
    background: var(--bubble-received);
    color: var(--light-text);
    cursor: default;
  }


  .file-upload-btn {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background-color: var(--surface-color);
    color: var(--light-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: var(--transition);
  }
  .file-upload-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .image-preview-container {
    position: fixed;
    bottom: 88px;
    left: 20px;
    max-width: 200px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    z-index: 6;
  }
  .image-preview-container img {
    width: 100%;
    display: block;
    border-radius: 8px;
  }
  .image-preview-container .remove-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
</style>
