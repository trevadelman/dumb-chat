<script lang="ts">
  import type { ChatMessage } from "../types";
  import { avatarFor, formatTime, renderMarkdown } from "../format";
  import { openExternal } from "../native";

  interface Props {
    message: ChatMessage;
    isCurrentUser: boolean;
    isFirstInGroup: boolean;
    onEdit: (message: ChatMessage) => void;
    onDelete: (message: ChatMessage) => void;
    onImageClick: (src: string) => void;
  }

  let {
    message,
    isCurrentUser,
    isFirstInGroup,
    onEdit,
    onDelete,
    onImageClick,
  }: Props = $props();

  let editing = $state(false);
  let editText = $state("");
  let menuVisible = $state(false);
  let menuX = $state(0);
  let menuY = $state(0);

  const isImage = $derived(
    !!(message.fileType && message.fileType.startsWith("image/")),
  );
  const attachmentSrc = $derived(message.fileData ?? message.fileURL ?? "");

  function startEditing() {
    if (!isCurrentUser || !message.text) return;
    editText = message.text;
    editing = true;
  }

  function commitEdit() {
    editing = false;
    onEdit({ ...message, text: editText });
  }

  function cancelEdit() {
    editing = false;
  }

  function onEditKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  function onContextMenu(e: MouseEvent) {
    if (!isCurrentUser) return;
    e.preventDefault();
    menuX = e.pageX;
    menuY = e.pageY;
    menuVisible = true;
  }

  function closeMenu() {
    menuVisible = false;
  }

  function onContentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains("external-link")) {
      e.preventDefault();
      const url = target.getAttribute("data-url");
      if (url) openExternal(url);
    }
  }

  function downloadAttachment() {
    const a = document.createElement("a");
    a.href = attachmentSrc;
    a.download = message.fileName ?? "image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Autofocus action for the edit textarea
  function focus(node: HTMLTextAreaElement) {
    node.focus();
    node.setSelectionRange(node.value.length, node.value.length);
  }
</script>


<svelte:window onclick={menuVisible ? closeMenu : undefined} />

<div class="message-container {isCurrentUser ? 'sent' : 'received'}">
  <div class="bubble-wrapper" class:reverse={isCurrentUser}>
    {#if isFirstInGroup}
      <div class="avatar">{avatarFor(message.username)}</div>
    {:else}
      <div class="spacer"></div>
    {/if}

    <div
      class="message {isCurrentUser ? 'sent' : 'received'}"
      data-timestamp={formatTime(message)}
      ondblclick={startEditing}
      oncontextmenu={onContextMenu}
      role="article"
    >
      {#if editing}
        <textarea
          class="message-edit-input"
          bind:value={editText}
          spellcheck="true"
          onkeydown={onEditKeydown}
          onblur={cancelEdit}
          use:focus
        ></textarea>

      {:else}
        {#if message.text}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <div class="content" onclick={onContentClick} role="presentation">
            {@html renderMarkdown(message.text)}
          </div>
        {/if}
        {#if message.edited}
          <span class="edited-indicator">(edited)</span>
        {/if}
        {#if attachmentSrc}
          {#if isImage}
            <div class="image-attachment">
              <img
                src={attachmentSrc}
                alt={message.fileName ?? "Image"}
                onclick={() => onImageClick(attachmentSrc)}
                role="presentation"
              />
              <button
                class="download-btn"
                title="Download image"
                onclick={downloadAttachment}>⬇️</button
              >
            </div>
          {:else}
            <div class="file-attachment">
              <a href={attachmentSrc} download={message.fileName ?? "file"}>
                📄 {message.fileName ?? "Download file"}
              </a>
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  </div>
</div>

{#if menuVisible}
  <div class="context-menu" style="left: {menuX}px; top: {menuY}px;">
    <div
      class="menu-item"
      onclick={() => {
        closeMenu();
        startEditing();
      }}
      role="menuitem"
      tabindex="0"
    >
      Edit Message
    </div>
    <div
      class="menu-item danger"
      onclick={() => {
        closeMenu();
        onDelete(message);
      }}
      role="menuitem"
      tabindex="0"
    >
      Delete Message
    </div>
  </div>
{/if}

<style>

  .message-container {
    display: flex;
    margin-bottom: 2px;
    align-items: flex-start;
    position: relative;
    width: 100%;
  }
  .message-container.sent {
    flex-direction: row-reverse;
  }

  .bubble-wrapper {
    display: flex;
    align-items: flex-start;
    max-width: 100%;
    min-width: 0;
  }

  .bubble-wrapper.reverse {
    flex-direction: row-reverse;
  }

  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3a3a3d, #2a2a2c);
    color: var(--text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    margin: 0 8px;
    flex-shrink: 0;
  }
  .message-container.sent .avatar {
    background: var(--bubble-sent-gradient);
    color: white;
  }

  .spacer {
    width: 30px;
    margin: 0 8px;
    flex-shrink: 0;
  }


  .message {
    padding: 9px 14px;
    border-radius: 18px;
    width: fit-content;
    max-width: 100%;
    position: relative;
    line-height: 1.4;
    margin-bottom: 1px;
  }

  .message.sent {
    background: var(--bubble-sent-gradient);
    color: white;
    border-bottom-right-radius: 5px;
  }
  .message.received {
    background-color: var(--bubble-received);
    color: var(--text-color);
    border-bottom-left-radius: 5px;
  }

  .message::after {
    content: attr(data-timestamp);
    position: absolute;
    top: -30px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
    white-space: nowrap;
    z-index: 10;
  }
  .message-container.sent .message::after {
    right: 0;
  }
  .message-container.received .message::after {
    left: 0;
  }
  .message:hover::after {
    opacity: 1;
  }

  .content {
    line-height: 1.5;
    font-size: 14px;
    overflow-wrap: break-word;
  }
  .content :global(a) {
    color: #4dabf7;
    text-decoration: underline;
    overflow-wrap: anywhere;
  }
  .message.sent .content :global(a) {
    color: #e0f0ff;
  }
  .content :global(.link-chip) {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 100%;
    padding: 2px 10px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #4dabf7;
    text-decoration: none;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: var(--transition);
  }
  .content :global(.link-chip:hover) {
    background-color: rgba(255, 255, 255, 0.14);
  }
  .message.sent .content :global(.link-chip) {
    color: #cfe3ff;
  }

  .content :global(.inline-code) {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.88em;
    background-color: rgba(0, 0, 0, 0.28);
    padding: 1px 5px;
    border-radius: 4px;
  }
  .content :global(.code-block) {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 0.85em;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 10px 12px;
    border-radius: 8px;
    margin: 6px 0;
    overflow-x: auto;
    white-space: pre;
  }
  .content :global(del) {
    opacity: 0.75;
  }
  .content :global(.md-h1),
  .content :global(.md-h2),
  .content :global(.md-h3) {
    margin: 6px 0 4px;
    font-weight: 600;
    line-height: 1.3;
  }
  .content :global(.md-h1) {
    font-size: 1.35em;
  }
  .content :global(.md-h2) {
    font-size: 1.2em;
  }
  .content :global(.md-h3) {
    font-size: 1.07em;
  }
  .content :global(.md-h1:first-child),
  .content :global(.md-h2:first-child),
  .content :global(.md-h3:first-child) {
    margin-top: 0;
  }
  /* Block elements emitted by marked (paragraphs, lists, quotes, tables). */
  .content :global(p) {
    margin: 0 0 8px;
  }
  .content :global(p:last-child) {
    margin-bottom: 0;
  }
  .content :global(ul),
  .content :global(ol) {
    margin: 4px 0 8px;
    padding-left: 20px;
  }
  .content :global(li) {
    margin: 2px 0;
  }
  .content :global(li > input[type="checkbox"]) {
    margin-right: 6px;
  }
  .content :global(blockquote) {
    margin: 6px 0;
    padding: 2px 0 2px 12px;
    border-left: 3px solid rgba(255, 255, 255, 0.25);
    color: var(--light-text);
  }
  .content :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    margin: 10px 0;
  }
  .content :global(table) {
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 0.92em;
  }
  .content :global(th),
  .content :global(td) {
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 4px 8px;
    text-align: left;
  }
  .content :global(th) {
    background-color: rgba(255, 255, 255, 0.06);
  }



  .edited-indicator {
    font-size: 0.7em;
    opacity: 0.7;
    margin-left: 5px;
    color: var(--light-text);
  }

  .image-attachment {
    margin-top: 8px;
    max-width: 100%;
    position: relative;
  }
  .image-attachment img {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    cursor: pointer;
  }
  .image-attachment .download-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .image-attachment:hover .download-btn {
    opacity: 1;
  }

  .file-attachment {
    margin-top: 8px;
    padding: 10px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
  .file-attachment a {
    display: flex;
    align-items: center;
    gap: 8px;
    color: inherit;
    text-decoration: none;
  }
  .file-attachment a:hover {
    text-decoration: underline;
  }

  .message-edit-input {
    width: 100%;
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--primary-color);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 14px;
    resize: none;
    min-height: 60px;
    outline: none;
  }

  .context-menu {
    position: absolute;
    background-color: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    box-shadow: var(--shadow-md);
    padding: 5px 0;
    z-index: 1000;
  }
  .menu-item {
    padding: 8px 12px;
    cursor: pointer;
    transition: var(--transition);
  }
  .menu-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  .menu-item.danger {
    color: #ff4d4f;
  }
  .menu-item.danger:hover {
    background-color: rgba(255, 77, 79, 0.1);
  }
</style>
