<script lang="ts">
  import type { UpdateInfo } from "../updater";

  interface Props {
    update: UpdateInfo;
    onDismiss: () => void;
  }

  let { update, onDismiss }: Props = $props();

  let installing = $state(false);
  let error = $state<string | null>(null);

  async function install() {
    installing = true;
    error = null;
    try {
      await update.apply();
    } catch (e) {
      error = (e as Error).message;
      installing = false;
    }
  }
</script>

<div class="update-banner">
  <div class="update-text">
    {#if error}
      <strong>Update failed:</strong> {error}
    {:else}
      <strong>Update available</strong> — v{update.version} is ready to install.
    {/if}
  </div>
  <div class="update-actions">
    <button class="install-btn" onclick={install} disabled={installing}>
      {installing ? "Installing…" : "Install & Restart"}
    </button>
    <button class="dismiss-btn" onclick={onDismiss} disabled={installing}>
      Later
    </button>
  </div>
</div>

<style>
  .update-banner {
    position: fixed;
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--surface-color);
    border: 1px solid var(--primary-color);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 200;
    box-shadow: var(--shadow-md);
    animation: fadeIn 0.3s;
    max-width: 90%;
  }
  .update-text {
    font-size: 14px;
    color: var(--text-color);
  }
  .update-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }
  .install-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
  }
  .install-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .dismiss-btn {
    background-color: transparent;
    color: var(--light-text);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
  }
  .dismiss-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
