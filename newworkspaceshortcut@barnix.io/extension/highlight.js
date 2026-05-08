// Highlight Focus — draws a temporary border around the focused window on focus change.
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class highlightFocus {
  constructor(settings) {
    this._settings = settings;
    this._borders = [];
    this._timeouts = [];
    this._sizing = false;
    this._handles_display = [];
    this._handles_wm = [];
    this._handles_settings = [];
    this._readSettings();
  }

  _readSettings() {
    this._borderColor   = this._settings.get_string('highlight-border-color');
    this._borderWidth   = this._settings.get_int('highlight-border-width');
    this._borderRadius  = this._settings.get_int('highlight-border-radius');
    this._hideDelay     = this._settings.get_int('highlight-hide-delay');
    this._disableHiding = this._settings.get_boolean('highlight-disable-hiding');
  }

  enable() {
    this._handles_display.push(
      global.display.connect('notify::focus-window', () => this._highlightWindow()),
      global.display.connect('grab-op-begin', () => this._removeAllBorders()),
      global.display.connect('grab-op-end', () => {
        this._removeAllBorders();
        this._highlightWindow();
      }),
    );
    this._handles_wm.push(
      global.window_manager.connect('size-change', () => {
        this._removeAllBorders();
        this._sizing = true;
      }),
      global.window_manager.connect('size-changed', () => {
        this._sizing = false;
        this._highlightWindow();
      }),
      global.window_manager.connect('unminimize', () => {
        this._sizing = true;
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
          this._sizing = false;
          this._highlightWindow();
          return GLib.SOURCE_REMOVE;
        });
      }),
    );

    for (const key of ['highlight-border-color', 'highlight-border-width', 'highlight-border-radius', 'highlight-hide-delay', 'highlight-disable-hiding']) {
      this._handles_settings.push(
        this._settings.connect(`changed::${key}`, () => this._readSettings()),
      );
    }

    const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
    const mode = Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW;
    Main.wm.addKeybinding('highlight-keybinding', this._settings, flag, mode, () => this._highlightWindow());

    // Highlight the current window immediately on enable
    this._highlightWindow();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    this._handles_wm.splice(0).forEach(h => global.window_manager.disconnect(h));
    this._handles_settings.splice(0).forEach(h => this._settings.disconnect(h));
    this._removeAllTimeouts();
    this._removeAllBorders();
    Main.wm.removeKeybinding('highlight-keybinding');
  }

  _removeAllBorders() {
    this._borders.splice(0).forEach(b => b?.destroy());
  }

  _removeAllTimeouts() {
    this._timeouts.splice(0).forEach(t => { if (t) GLib.Source.remove(t); });
  }

  _highlightWindow() {
    if (this._sizing) return;

    this._removeAllBorders();
    this._removeAllTimeouts();

    const win = global.display.focus_window;
    if (
      win === null ||
      win.window_type !== Meta.WindowType.NORMAL ||
      (win.maximized_horizontally && win.maximized_vertically)
    ) return;

    const border = new St.Bin();
    border.style = `border: ${this._borderWidth}px solid ${this._borderColor}; border-radius: ${this._borderRadius}px;`;

    const rect = win.get_frame_rect();
    const inset = this._borderWidth;
    border.set_size(rect.width + inset * 2, rect.height + inset * 2);
    border.set_position(rect.x - inset, rect.y - inset);

    global.window_group.add_child(border);
    border.show();
    this._borders.push(border);

    if (!this._disableHiding) {
      this._timeouts.push(
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._hideDelay, () => {
          this._removeAllBorders();
          return GLib.SOURCE_REMOVE;
        }),
      );
    }
  }
}
