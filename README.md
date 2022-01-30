# Flash

![Preview](preview.gif)
<br>
<br>

Flash is the super fast and smart way to manage all of your open tabs and bookmarks and quickly search your history.

[👉 Get it now](https://chrome.google.com/webstore/detail/...tbd...)

_NOTE: **This is a fork of [Omni](https://github.com/alyssaxuu/omni) Chrome extension by [Alyssa X](https://alyssax.com).** It started to greatly deviate so a separate extension was created with permission._ 

## Table of contents

- [Features](#features)
- [Controlling the interface](#controlling-the-interface)
  - [Opening Flash](#opening-flash)
  - [Closing Flash](#closing-flash)
  - [Switching between dark and light mode](#switching-between-dark-and-light-mode)
- [List of commands](#list-of-commands)
- [Self-hosting Flash](#self-hosting-flash)
- [Libraries used](#libraries-used)

## Features

🗄 Switch, open, close, and search your tabs<br> 📚 Browse and manage your bookmarks<br> 🔍 Search your browsing history<br> ⚡️ 50+ actions to improve your productivity<br> 🔮 Special commands to filter and perform more actions<br> 🧩 Integrations with Notion, Figma, Docs, Asana...<br> ⌨️ Shortcuts for actions such as muting, pinning, bookmarking...<br> ⚙️ Advanced settings to help troubleshoot browsing issues<br> 🌙 Dark mode<br> ...and much more - all for free & no sign in needed!

## Controlling the interface

### Opening Flash

To open Flash, simply press `⌘+K` on Mac or `Ctrl+K` on Windows. You can configure a custom shortcut by going to chrome://extensions/shortcuts.

You can also click on the extension icon in the toolbar to toggle it.

### Closing Flash

To close Flash you can press `Esc`, click on the background, or press the extension icon.

### Switching between dark and light mode

The dark and light theme in Flash is tied to your system's theme.

On Mac you can change the theme by clicking on the Apple menu (on the top left), opening the System preferences, going into the General section, and then choosing between dark, light, or auto.

On Windows it depends on the OS version. [Here is a guide for Windows 11 and 10.](https://support.microsoft.com/en-us/windows/change-desktop-background-and-colors-176702ca-8e24-393b-15f2-b15b38f69de6#ID0EBF=Windows_11)

After switching the theme you might need to restart Chrome.

## List of commands

You can use a variety of commands with Flash to perform actions or filter your results.

- **/tabs**: Search your tabs
- **/bookmarks**: Search your bookmarks
- **/history**: Search your browser history
- **/actions**: Search all available actions
- **/remove**: Remove a bookmark or close a tab

## Self-hosting Flash

You can run this Chrome extension locally by:

1. Clone this repo
2. Install NPM dependencies (install [pnpm here](https://pnpm.io/installation)): `npm i` or `pnpm i` 
3. Go to chrome://extensions/ in your browser, and [enable developer mode](https://developer.chrome.com/docs/extensions/mv2/faq/#:~:text=You%20can%20start%20by%20turning,a%20packaged%20extension%2C%20and%20more.).
4. Hit "Load unpacked" to load an unpacked extension
5. Select the `./src` folder

## Libraries used

- [Preact](https://preactjs.com/)

## Tools used

- https://boxy-svg.com/
