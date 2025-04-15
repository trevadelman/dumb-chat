# Dumb Chat

A simple, real-time desktop chat application built with Electron and Firebase, designed for two users to chat from different networks.

## Overview

Dumb Chat is a native-feeling chat application that works across different MacBooks, with no installation or setup required for the other user. It's a fully self-contained `.app` file on macOS that allows instant messaging using Firebase.

## Features

- **Real-time messaging** - Messages appear instantly as they're sent
- **User switching** - Switch between users (Trevor and Kyle) for testing
- **File attachments** - Send images and files
- **Message editing** - Double-click or right-click to edit your messages
- **Message deletion** - Right-click to delete your messages
- **Markdown support** - Use **bold** and *italic* text formatting
- **Notifications** - Desktop, sound, and badge notifications
- **Spell checking** - Built-in spell checking with suggestions
- **Offline support** - Messages are cached for offline viewing
- **Context menu** - Right-click for cut, copy, paste options
- **Keyboard shortcuts** - Shortcuts for formatting and sending messages
- **Image lightbox** - Click on images to view them in full size
- **Clipboard image pasting** - Paste images directly from clipboard

## Technologies Used

- **Electron** - For creating the desktop application
- **Firebase Firestore** - For real-time database functionality
- **HTML/CSS/JavaScript** - For the user interface
- **electron-builder** - For packaging the application

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/trevadelman/dumb-chat.git
cd dumb-chat
```

2. Install dependencies:
```bash
npm install
```

3. Start the application in development mode:
```bash
npm start
```

## Usage

- **Sending Messages**: Type in the message input field and press Enter or click the send button
- **Attaching Files**: Click the paperclip icon or paste images directly from clipboard
- **Editing Messages**: Double-click or right-click on your own messages to edit them
- **Deleting Messages**: Right-click on your own messages and select "Delete Message"
- **Switching Users**: Click the settings icon (⚙️) and select a different user from the dropdown
- **Notifications**: Configure notification settings in the settings menu

## Building for Distribution

To build the application for macOS:

```bash
npm run build
```

This will create a `.dmg` file in the `dist` directory that can be shared with other users.

## Firebase Configuration

The application uses Firebase Firestore for real-time messaging. The Firebase configuration is already set up in the `index.html` file.

## Project Structure

```
dumb-chat/
│
├── main.js         ← Electron entry script (launches app window)
├── index.html      ← Chat UI and Firebase integration
├── package.json    ← App metadata and scripts
├── .gitignore      ← Git ignore file
└── README.md       ← Project documentation
```

### File Descriptions

#### `main.js`
- Starts the Electron app
- Opens an 800x600px window and loads `index.html` inside it
- Sets up spell checking and context menu
- Handles badge updates for notifications

#### `index.html`
- Contains the chat interface
- Includes Firebase SDK integration
- Handles real-time message synchronization
- Manages user interface and interactions

#### `package.json`
- Defines app name, version, and dependencies
- Contains scripts for starting and building the app
- Includes electron-builder configuration for packaging

## License

ISC
