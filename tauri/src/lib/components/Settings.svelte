<script lang="ts">
  import type { NotificationSettings, UserName } from "../types";
  import { ensureNotificationPermission } from "../native";

  interface Props {
    currentUser: UserName;
    settings: NotificationSettings;
    notificationSound: HTMLAudioElement;
    onUserChange: (user: UserName) => void;
    onSettingsChange: (settings: NotificationSettings) => void;
    onCheckForUpdate: () => Promise<string>;
  }

  let {
    currentUser,
    settings = $bindable(),
    notificationSound,
    onUserChange,
    onSettingsChange,
    onCheckForUpdate,
  }: Props = $props();

  let checkingUpdate = $state(false);
  let updateStatus = $state("");

  async function checkForUpdates() {
    checkingUpdate = true;
    updateStatus = "Checking...";
    updateStatus = await onCheckForUpdate();
    checkingUpdate = false;
  }


  function selectUser(e: Event) {
    onUserChange((e.target as HTMLSelectElement).value as UserName);
  }

  function update() {
    onSettingsChange(settings);
  }

  async function onDesktopChange() {
    update();
    if (settings.desktop) await ensureNotificationPermission();
  }

  function testSound() {
    notificationSound.play().catch((err) => {
      console.error("Error playing notification sound:", err);
    });
  }
</script>

<div class="settings-dropdown" onclick={(e) => e.stopPropagation()} role="menu" tabindex="-1">
  <div class="header-row">
    <h3>Current User: <span>{currentUser}</span></h3>
    <button
      class="update-btn"
      onclick={checkForUpdates}
      disabled={checkingUpdate}
      title="Check for updates">🔄 Updates</button
    >
  </div>
  {#if updateStatus}
    <p class="update-status">{updateStatus}</p>
  {/if}

  <div class="user-select">
    <label for="user-select">Select User</label>
    <select id="user-select" value={currentUser} onchange={selectUser}>
      <option value="Trevor">Trevor</option>
      <option value="Kyle">Kyle</option>
    </select>
  </div>
  <div class="settings-section">
    <h3>Notifications</h3>
    <div class="setting-item">
      <label>
        <input
          type="checkbox"
          bind:checked={settings.desktop}
          onchange={onDesktopChange}
        />
        Desktop Notifications
      </label>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={settings.sound} onchange={update} />
        Sound Notifications
      </label>
      <button class="icon-btn" onclick={testSound} title="Test notification sound"
        >(🔊 test)</button
      >

    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={settings.badge} onchange={update} />
        Badge Notifications
      </label>
    </div>
  </div>
  <details class="settings-section accordion">
    <summary><h3>Formatting & Shortcuts</h3></summary>
    <div class="shortcut">
      <span>Bold</span>
      <span class="shortcut-key">Cmd/Ctrl + B</span>
    </div>
    <div class="shortcut">
      <span>Italic</span>
      <span class="shortcut-key">Cmd/Ctrl + I</span>
    </div>
    <div class="shortcut">
      <span>Send</span>
      <span class="shortcut-key">Enter</span>
    </div>
    <div class="shortcut">
      <span>New line</span>
      <span class="shortcut-key">Shift + Enter</span>
    </div>
    <div class="shortcut">
      <span>Strikethrough</span>
      <span class="shortcut-key">~~text~~</span>
    </div>
    <div class="shortcut">
      <span>Headers</span>
      <span class="shortcut-key"># / ## / ###</span>
    </div>
    <div class="shortcut">
      <span>Inline code</span>
      <span class="shortcut-key">`code`</span>
    </div>
    <div class="shortcut">
      <span>Code block</span>
      <span class="shortcut-key">```code```</span>
    </div>
    <p class="hint">Double-click your message to edit · right-click to edit or delete.</p>
  </details>
</div>


<style>
  .settings-dropdown {
    position: absolute;
    top: 48px;
    right: 12px;
    background-color: var(--surface-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    min-width: 240px;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 100;
    animation: fadeIn 0.2s;
  }
  h3 {
    padding: 16px;
    margin: 0;
    font-size: 14px;
    color: var(--light-text);
    border-bottom: 1px solid var(--border-color);
    font-weight: 500;
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-right: 12px;
    border-bottom: 1px solid var(--border-color);
  }
  .header-row h3 {
    border-bottom: none;
    flex: 1;
  }
  .update-btn {
    flex-shrink: 0;
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    white-space: nowrap;
  }
  .update-btn:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  .update-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
  .update-status {
    margin: 0;
    padding: 8px 16px;
    font-size: 12px;
    color: var(--light-text);
    border-bottom: 1px solid var(--border-color);
  }

  .user-select,
  .settings-section {
    padding: 14px 16px;
    border-top: 1px solid var(--border-color);
  }
  .settings-section h3 {
    padding: 0 0 8px 0;
    border-bottom: none;
  }
  .accordion {
    padding-top: 0;
    padding-bottom: 0;
  }
  .accordion summary {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 0;
    user-select: none;
  }
  .accordion summary::-webkit-details-marker {
    display: none;
  }
  .accordion summary h3 {
    padding: 0;
  }
  .accordion summary::before {
    content: "▶";
    color: var(--text-color);
    font-size: 11px;
    transition: var(--transition);
  }
  .accordion[open] summary::before {
    transform: rotate(90deg);
  }

  .accordion[open] {
    padding-bottom: 14px;
  }

  .user-select label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--light-text);
  }
  select {
    width: 100%;
    padding: 10px;
    background-color: var(--bg-color);
    color: var(--text-color);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 14px;
    cursor: pointer;
  }
  select:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  .setting-item {
    margin: 10px 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 6px;
  }

  .setting-item label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-color);
  }
  .setting-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  .icon-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 2px 4px;
    font-size: 12px;
    color: var(--light-text);
    line-height: 1;
    cursor: pointer;
    opacity: 0.7;
    transition: var(--transition);
    white-space: nowrap;
  }
  .icon-btn:hover {
    opacity: 1;
    transform: scale(1.15);
  }

  .shortcut {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin: 7px 0;
    font-size: 13px;
    color: var(--text-color);
  }
  .shortcut-key {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    padding: 2px 7px;
    border-radius: 5px;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 12px;
    color: var(--light-text);
    white-space: nowrap;
  }
  .hint {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--light-text);
  }
</style>

