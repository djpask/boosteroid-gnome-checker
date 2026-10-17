import Soup from 'gi://Soup?version=3.0';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const BOOSTEROID_MD5_URL = 'https://boosteroid.com/linux/installer/boosteroid-install-x64.md5';
const CHECK_INTERVAL_SECONDS = 12 * 60 * 60; // 12 hours

export default class BoosteroidCheckerExtension extends Extension {
    constructor(metadata) {
        super(metadata);
    }

    enable() {
        this._indicator = new PanelMenu.Button(0.0, 'Boosteroid Checker', false);
        
        this._icon = new St.Icon({
            icon_name: 'input-gaming-symbolic',
            style_class: 'system-status-icon',
        });
        
        this._indicator.add_child(this._icon);

        // Add menu items
        this._checkNowItem = new PopupMenu.PopupMenuItem('Check Now');
        this._checkNowItem.connect('activate', () => {
            this._checkMd5(true);
        });
        this._indicator.menu.addMenuItem(this._checkNowItem);
        
        // Add indicator to the panel
        Main.panel.addToStatusArea('BoosteroidChecker', this._indicator);

        // Setup Soup Session
        this._httpSession = new Soup.Session();

        // Setup file for storing state
        const cacheDir = GLib.get_user_cache_dir();
        const extensionCacheDir = GLib.build_filenamev([cacheDir, 'boosteroid-checker']);
        GLib.mkdir_with_parents(extensionCacheDir, 0o755);
        this._stateFile = Gio.File.new_for_path(GLib.build_filenamev([extensionCacheDir, 'last-md5.txt']));

        // Start timer
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, CHECK_INTERVAL_SECONDS, () => {
            this._checkMd5(false);
            return GLib.SOURCE_CONTINUE;
        });
        
        // Run initial check
        this._checkMd5(false);
    }

    disable() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }

        if (this._httpSession) {
            this._httpSession.abort();
            this._httpSession = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }

    _getLastMd5() {
        try {
            if (this._stateFile.query_exists(null)) {
                const [success, contents] = this._stateFile.load_contents(null);
                if (success) {
                    return new TextDecoder().decode(contents).trim();
                }
            }
        } catch (e) {
            console.error('Failed to read last MD5 state:', e);
        }
        return null;
    }

    _saveLastMd5(md5Str) {
        try {
            this._stateFile.replace_contents_bytes_async(
                new GLib.Bytes(md5Str),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
                (file, res) => {
                    try {
                        file.replace_contents_finish(res);
                    } catch (e) {
                        console.error('Failed to finish writing MD5 state:', e);
                    }
                }
            );
        } catch (e) {
            console.error('Failed to write MD5 state:', e);
        }
    }

    _checkMd5(isManualCheck) {
        const msg = Soup.Message.new('GET', BOOSTEROID_MD5_URL);
        
        this._httpSession.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (session, res) => {
            try {
                const bytes = session.send_and_read_finish(res);
                const status = msg.get_status();
                
                if (status === Soup.Status.OK) {
                    const newMd5Str = new TextDecoder().decode(bytes.get_data()).trim();
                    const lastMd5Str = this._getLastMd5();

                    const md5Parts = newMd5Str.split(/\s+/);
                    const filename = md5Parts.length > 1 ? md5Parts[1] : '';

                    if (lastMd5Str !== null && lastMd5Str !== newMd5Str) {
                        // File has changed
                        let message = 'The Boosteroid installer has been updated!';
                        if (isManualCheck && filename) {
                            message += `\nLatest version: ${filename}`;
                        }
                        Main.notify('Boosteroid Update', message);
                        this._icon.add_style_class_name('boosteroid-icon-updated');
                    } else if (isManualCheck) {
                        // If it was manual and hasn't changed, let the user know
                        let message = 'No updates found.';
                        if (filename) {
                            message += `\nCurrent version: ${filename}`;
                        }
                        Main.notify('Boosteroid Checker', message);
                        this._icon.remove_style_class_name('boosteroid-icon-updated');
                    }
                    
                    // Always save the latest MD5
                    this._saveLastMd5(newMd5Str);
                } else {
                    console.error('Boosteroid check failed with status:', status);
                }
            } catch (e) {
                console.error('Error in Boosteroid check:', e);
            }
        });
    }
}
