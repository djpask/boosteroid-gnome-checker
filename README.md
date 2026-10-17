# Boosteroid MD5 Checker (GNOME Shell Extension)

A lightweight GNOME Shell extension that monitors updates to the official Boosteroid Linux installer MD5 checksum and notifies you whenever a new version is released.

## Features

- **Automatic Periodic Checks**: Checks for updates every 12 hours in the background.
- **Manual Check**: Provides a panel indicator menu with a "Check Now" button to verify immediately.
- **Desktop Notifications**: Displays a native GNOME Shell notification when an update is detected, along with the latest version filename.
- **Visual Alert**: Highlights the panel icon when an update is available.
- **Modern GNOME Compatibility**: Supports GNOME Shell 45 through 51 (ESM architecture & libsoup 3).

## Installation

### Method 1: Install from source

1. Clone this repository into your local GNOME extensions directory:
   ```bash
   git clone https://github.com/djpask/boosteroid-gnome-checker.git ~/.local/share/gnome-shell/extensions/boosteroid-checker@pask.com
   ```

2. Enable the extension:
   ```bash
   gnome-extensions enable boosteroid-checker@pask.com
   ```

3. Restart GNOME Shell:
   - On **Wayland**: Log out and log back in.
   - On **X11**: Press `Alt + F2`, type `r`, and press `Enter`.

### Method 2: Package and install as zip

1. Pack the extension:
   ```bash
   gnome-extensions pack --force --extra-source=stylesheet.css --out-dir=. .
   ```

2. Install the bundle:
   ```bash
   gnome-extensions install --force boosteroid-checker@pask.com.shell-extension.zip
   ```

3. Enable the extension and reload GNOME Shell.

## Compatibility

- GNOME Shell: **45, 46, 47, 48, 49, 50, 51**

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See [LICENSE](LICENSE) for details.
