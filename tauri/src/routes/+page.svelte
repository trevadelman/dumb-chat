<script lang="ts">
  import "../lib/theme.css";
  import type { ChatMessage, NotificationSettings, UserName } from "../lib/types";
  import {
    subscribeToMessages,
    fetchOlderMessages,
    sendMessage,
    editMessage,
    removeMessage,
  } from "../lib/firebase";

  import { notify, updateBadge, ensureNotificationPermission } from "../lib/native";
  import {
    loadUser,
    saveUser,
    loadNotificationSettings,
    saveNotificationSettings,
  } from "../lib/settings";
  import { onMount } from "svelte";
  import { checkForUpdate, type UpdateInfo } from "../lib/updater";
  import MessageList from "../lib/components/MessageList.svelte";
  import ChatInput from "../lib/components/ChatInput.svelte";
  import Settings from "../lib/components/Settings.svelte";
  import Lightbox from "../lib/components/Lightbox.svelte";
  import UpdateBanner from "../lib/components/UpdateBanner.svelte";

  let currentUser = $state<UserName>(loadUser());
  let settings = $state<NotificationSettings>(loadNotificationSettings());
  // `liveWindow` is the realtime newest-N window; `older` holds pages fetched
  // by scrolling back. They are merged (and de-duped) for display.
  let liveWindow = $state<ChatMessage[]>([]);
  let older = $state<ChatMessage[]>([]);
  let hasMore = $state(false);
  let loadingOlder = $state(false);
  let status = $state("Connecting...");
  let lightboxSrc = $state<string | null>(null);

  // Merge older history before the live window, dropping any id that the live
  // window also contains so overlap at the boundary never double-renders.
  const messages = $derived.by(() => {
    const liveIds = new Set(liveWindow.map((m) => m.id));
    return [...older.filter((m) => !liveIds.has(m.id)), ...liveWindow];
  });


  let settingsOpen = $state(false);
  let pendingUpdate = $state<UpdateInfo | null>(null);

  // Check GitHub releases for a newer version on launch.
  onMount(async () => {
    try {
      pendingUpdate = await checkForUpdate();
    } catch (e) {
      console.error("Update check failed:", e);
    }
  });


  let unreadCount = 0;
  let windowFocused = true;

  const notificationSound = new Audio(
    "https://soundbible.com/mp3/Pling-KevanGC-1485374730.mp3",
  );

  function resetUnread() {
    unreadCount = 0;
    if (settings.badge) updateBadge(0);
  }

  function handleNewMessages(added: ChatMessage[]) {
    if (windowFocused || added.length === 0) return;
    unreadCount += added.length;
    if (settings.badge) updateBadge(unreadCount);

    const last = added[added.length - 1];
    if (settings.desktop) {
      notify("New message from " + last.username, last.text || "New message");
    }
    if (settings.sound) {
      notificationSound.play().catch(() => {});
    }
  }

  // Subscribe to Firestore; re-subscribe when the current user changes.
  $effect(() => {
    const user = currentUser;
    const unsubscribe = subscribeToMessages(
      user,
      ({ messages: list, addedFromOthers, hasMore: more }) => {
        status = "Connected";
        liveWindow = list;
        hasMore = older.length === 0 ? more : hasMore;
        handleNewMessages(addedFromOthers);
      },
      (error) => {
        status = "Connection Error: " + error.message;
      },
    );
    return unsubscribe;
  });

  // Fetch the next older page when the user scrolls to the top. Returns the
  // count prepended so the list can preserve the scroll anchor.
  async function onLoadOlder(): Promise<number> {
    if (loadingOlder || !hasMore) return 0;
    const oldest = messages[0];
    if (!oldest) return 0;
    loadingOlder = true;
    try {
      const result = await fetchOlderMessages(oldest);
      older = [...result.messages, ...older];
      hasMore = result.hasMore;
      return result.messages.length;
    } catch (e) {
      console.error("Failed to load older messages:", e);
      return 0;
    } finally {
      loadingOlder = false;
    }
  }


  $effect(() => {
    if (settings.desktop) ensureNotificationPermission();
  });

  function onUserChange(user: UserName) {
    currentUser = user;
    saveUser(user);
  }

  function onSettingsChange(next: NotificationSettings) {
    settings = next;
    saveNotificationSettings(next);
  }

  // Manual update check triggered from Settings. Reuses the same flow as the
  // launch check: a found update populates `pendingUpdate` so the existing
  // UpdateBanner appears. Returns a short status string for the button to show.
  async function onCheckForUpdate(): Promise<string> {
    try {
      const update = await checkForUpdate();
      if (update) {
        pendingUpdate = update;
        return `Update available: v${update.version}`;
      }
      return "You're up to date";
    } catch (e) {
      console.error("Update check failed:", e);
      return "Update check failed";
    }
  }


  async function onSend(
    text: string,
    image: { data: string; type: string; sizeMb: number } | null,
  ) {
    try {
      const message: Parameters<typeof sendMessage>[0] = {
        username: currentUser,
      };
      if (text) message.text = text;
      if (image) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        message.fileData = image.data;
        message.fileName = `pasted-image-${stamp}.png`;
        message.fileType = image.type;
        message.fileSize = image.sizeMb;
      }
      await sendMessage(message);
    } catch (e) {
      alert("Error sending message: " + (e as Error).message);
    }
  }

  async function onEdit(message: ChatMessage) {
    if (!message.text) return;
    try {
      await editMessage(message.id, message.text);
    } catch (e) {
      alert("Error editing message: " + (e as Error).message);
    }
  }

  async function onDelete(message: ChatMessage) {
    try {
      await removeMessage(message.id);
    } catch (e) {
      alert("Error deleting message: " + (e as Error).message);
    }
  }

  function closeDropdowns() {
    settingsOpen = false;
  }
</script>



<svelte:window
  onfocus={() => {
    windowFocused = true;
    resetUnread();
  }}
  onblur={() => (windowFocused = false)}
  onclick={closeDropdowns}
/>

<button
  class="settings-fab"
  class:active={settingsOpen}
  title="Settings"
  onclick={(e) => {
    e.stopPropagation();
    settingsOpen = !settingsOpen;
  }}>⚙️</button
>

{#if pendingUpdate}

  <UpdateBanner update={pendingUpdate} onDismiss={() => (pendingUpdate = null)} />
{/if}

<div class="chat-container">
  {#if settingsOpen}
    <Settings
      {currentUser}
      bind:settings
      {notificationSound}
      {onUserChange}
      {onSettingsChange}
      {onCheckForUpdate}
    />
  {/if}

  <MessageList
    {messages}
    {currentUser}
    {hasMore}
    {loadingOlder}
    {onLoadOlder}
    {onEdit}
    {onDelete}
    onImageClick={(src) => (lightboxSrc = src)}
  />


  <ChatInput {onSend} onStatus={(s) => (status = s)} />
</div>

{#if lightboxSrc}
  <Lightbox src={lightboxSrc} onClose={() => (lightboxSrc = null)} />
{/if}

<style>
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    position: relative;
  }

  .settings-fab {
    position: fixed;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: transparent;
    border: none;
    color: var(--light-text);
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.35;
    transition: var(--transition);
    z-index: 50;
  }
  .settings-fab:hover,
  .settings-fab.active {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.08);
  }
</style>

