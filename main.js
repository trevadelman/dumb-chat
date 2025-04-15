const { app, BrowserWindow, ipcMain, Menu, MenuItem } = require('electron');

// Set application name
app.name = 'Dumb Chat';

// Enable spell checking
app.commandLine.appendSwitch('enable-spellcheck');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Dumb Chat',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: true
    }
  });

  win.loadFile('index.html');
  
  // Set up context menu with spell check
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();
    
    // Add spell check suggestions if misspelled
    if (params.misspelledWord) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion)
        }));
      }
      
      // Add separator if we have suggestions
      if (params.dictionarySuggestions.length > 0) {
        menu.append(new MenuItem({ type: 'separator' }));
      }
      
      // Add to dictionary option
      menu.append(new MenuItem({
        label: 'Add to Dictionary',
        click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
      }));
      
      menu.append(new MenuItem({ type: 'separator' }));
    }
    
    // Standard edit operations
    if (params.isEditable) {
      // Add cut, copy, paste options for editable fields
      if (params.selectionText) {
        menu.append(new MenuItem({ label: 'Cut', role: 'cut' }));
        menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      }
      
      menu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
      
      if (params.selectionText) {
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
      }
    } else if (params.selectionText) {
      // Just copy option for non-editable fields with selection
      menu.append(new MenuItem({ label: 'Copy', role: 'copy' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));
    }
    
    // Show the menu if it has items
    if (menu.items.length > 0) {
      menu.popup();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle badge updates from renderer process
ipcMain.on('update-badge', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? count.toString() : '');
  } else if (process.platform === 'win32') {
    // Windows implementation
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setOverlayIcon(
        count > 0 ? createOverlayIcon(count) : null,
        count > 0 ? `${count} new messages` : ''
      );
    }
  }
});

// Create overlay icon for Windows
function createOverlayIcon(count) {
  // This is a simplified implementation
  // In a real app, you would create a proper icon with the count
  // For now, we'll just return null which will clear the overlay
  return null;
}
