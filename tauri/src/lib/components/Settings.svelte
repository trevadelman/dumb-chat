<script lang="ts">
  import type { NotificationSettings, UserName } from "../types";
  import {
    ensureNotificationPermission,
    openSystemNotificationSettings,
  } from "../native";

  interface Props {
    currentUser: UserName;
    settings: NotificationSettings;
    notificationSound: HTMLAudioElement;
    onUserChange: (user: UserName) => void;
    onSettingsChange: (settings: NotificationSettings) => void;
  }

  let {
    currentUser,
    settings = $bindable(),
    notificationSound,
    onUserChange,
    onSettingsChange,
  }: Props = $props();

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
  <h3>Current User: <span>{currentUser}</span></h3>
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
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" bind:checked={settings.badge} onchange={update} />
        Badge Notifications
      </label>
    </div>
    <div class="setting-item">
      <button class="test-btn" onclick={testSound}
        >🔊 Test Notification Sound</button
      >
    </div>
    <div class="setting-item">
      <button class="test-btn" onclick={openSystemNotificationSettings}
        >⚙️ Open System Settings</button
      >
    </div>
  </div>
  <div class="settings-section">
    <h3>Formatting & Shortcuts</h3>
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
  </div>
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
  .user-select,
  .settings-section {
    padding: 14px 16px;
    border-top: 1px solid var(--border-color);
  }
  .settings-section h3 {
    padding: 0 0 8px 0;
    border-bottom: none;
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
  .test-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
    width: 100%;
    text-align: center;
    margin: 5px 0;
    font-weight: 500;
    box-shadow: var(--shadow-sm);
  }
  .test-btn:hover {
    background-color: #2a75f3;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
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

