<script lang="ts">
  import type { ChatMessage, UserName } from "../types";
  import { buildRenderItems, otherUser } from "../format";
  import Message from "./Message.svelte";

  interface Props {
    messages: ChatMessage[];
    currentUser: UserName;
    hasMore: boolean;
    loadingOlder: boolean;
    onLoadOlder: () => Promise<number>;
    onEdit: (message: ChatMessage) => void;
    onDelete: (message: ChatMessage) => void;
    onImageClick: (src: string) => void;
  }

  let {
    messages,
    currentUser,
    hasMore,
    loadingOlder,
    onLoadOlder,
    onEdit,
    onDelete,
    onImageClick,
  }: Props = $props();

  const items = $derived(buildRenderItems(messages));

  let container: HTMLDivElement | undefined = $state();
  let isAtBottom = true;
  let didInitialScroll = false;

  async function loadOlder() {
    if (!container || loadingOlder || !hasMore) return;
    // Capture height before prepending so we can restore the viewport anchor.
    const before = container.scrollHeight;
    const added = await onLoadOlder();
    if (added === 0) return;
    // After the new rows render, offset scrollTop by the height they added so
    // the messages the user was reading stay visually fixed (no jump).
    queueMicrotask(() => {
      if (!container) return;
      container.scrollTop += container.scrollHeight - before;
    });
  }

  function onScroll() {
    if (!container) return;
    isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    if (container.scrollTop < 120 && hasMore && !loadingOlder) loadOlder();
  }


  function scrollToBottom() {
    if (container) container.scrollTop = container.scrollHeight;
  }

  // Auto-scroll to bottom when messages change if we were at the bottom.
  $effect(() => {
    // reference items so the effect re-runs on new messages
    items;
    if (!container) return;

    // On the first non-empty render, force a jump to the latest message.
    // Images load asynchronously and grow the scroll height after layout,
    // so re-pin once they finish to land exactly at the bottom.
    if (!didInitialScroll && messages.length > 0) {
      didInitialScroll = true;
      queueMicrotask(scrollToBottom);
      const imgs = container.querySelectorAll("img");
      imgs.forEach((img) => {
        if (!img.complete) img.addEventListener("load", scrollToBottom, { once: true });
      });
      return;
    }

    if (isAtBottom) queueMicrotask(scrollToBottom);
  });
</script>


<div class="chat-messages" bind:this={container} onscroll={onScroll}>
  {#if messages.length === 0}
    <div class="empty-chat">
      <div class="empty-icon">💬</div>
      <h2>No messages yet</h2>
      <p>Say hi to {otherUser(currentUser)} to start the conversation.</p>
    </div>
  {:else}
    {#if loadingOlder}
      <div class="loading-older">Loading older messages…</div>
    {/if}
    {#each items as item}

      {#if item.type === "separator"}
        <div class="date-separator">{item.label}</div>
      {:else if item.message}
        <div
          class="message-group {item.message.username === currentUser
            ? 'sent'
            : 'received'}"
        >
          <Message
            message={item.message}
            isCurrentUser={item.message.username === currentUser}
            isFirstInGroup={item.isFirstInGroup ?? true}
            {onEdit}
            {onDelete}
            {onImageClick}
          />
        </div>
      {/if}
    {/each}
  {/if}
</div>

<style>
  .chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    margin-bottom: 80px;
  }

  .loading-older {
    text-align: center;
    color: var(--light-text);
    font-size: 13px;
    padding: 8px 0 14px;
  }

  .date-separator {
    display: flex;

    align-items: center;
    margin: 30px 0;
    color: var(--light-text);
    font-size: 13px;
    text-align: center;
  }
  .date-separator::before,
  .date-separator::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--border-color);
  }
  .date-separator::before {
    margin-right: 15px;
  }
  .date-separator::after {
    margin-left: 15px;
  }

  .message-group {
    margin-bottom: 4px;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.3s;
    max-width: 70%;
  }
  .message-group.sent {
    align-items: flex-end;
    align-self: flex-end;
    margin-left: auto;
  }
  .message-group.received {
    align-items: flex-start;
    align-self: flex-start;
    margin-right: auto;
  }

  .empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--light-text);
    text-align: center;
    padding: 20px;
  }
  .empty-icon {
    font-size: 44px;
    margin-bottom: 16px;
    opacity: 0.85;
  }
  .empty-chat h2 {
    margin-bottom: 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-color);
  }

  .empty-chat p {
    max-width: 400px;
    line-height: 1.6;
    font-size: 15px;
  }
</style>
