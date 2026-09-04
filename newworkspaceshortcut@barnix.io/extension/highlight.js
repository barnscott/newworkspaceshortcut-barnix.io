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
    this._handles_display = [];
    this._handles_settings = [];
    this._handles_window = [];
    this._watchedWindow = null;
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
    // Never redraw from a geometry signal: size-change fires mid-transition.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/50.4/src/core/window.c#L3324
    this._handles_display.push(
      global.display.connect('notify::focus-window', () => this._highlightWindow()),
    );

    for (const key of ['highlight-border-color', 'highlight-border-width', 'highlight-border-radius', 'highlight-hide-delay', 'highlight-disable-hiding']) {
      this._handles_settings.push(
        this._settings.connect(`changed::${key}`, () => this._readSettings()),
      );
    }

    const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
    const mode = Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW;
    Main.wm.addKeybinding('highlight-keybinding', this._settings, flag, mode, () => this._highlightWindow());

    this._highlightWindow();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    this._handles_settings.splice(0).forEach(h => this._settings.disconnect(h));
    this._unwatchWindow();
    this._clearHighlight();
    Main.wm.removeKeybinding('highlight-keybinding');
  }

  _removeAllBorders() {
    this._borders.splice(0).forEach(b => b?.destroy());
  }

  _removeAllTimeouts() {
    this._timeouts.splice(0).forEach(t => { if (t) GLib.Source.remove(t); });
  }

  _clearHighlight() {
    this._removeAllBorders();
    this._removeAllTimeouts();
  }

  // Skip edge-flush windows: a snap reads as a vertical-only maximize.
  // https://gitlab.gnome.org/GNOME/mutter/-/issues/225
  _shouldSkip(win) {
    return win === null ||
      win.window_type !== Meta.WindowType.NORMAL ||
      win.is_fullscreen() ||
      win.maximized_horizontally ||
      win.maximized_vertically;
  }

  // Teardown only — never draw here.
  _watchWindow(win) {
    this._watchedWindow = win;
    this._handles_window = [
      win.connect('notify::maximized-horizontally', () => this._clearHighlight()),
      win.connect('notify::maximized-vertically', () => this._clearHighlight()),
      win.connect('notify::fullscreen', () => this._clearHighlight()),
    ];
  }

  _unwatchWindow() {
    if (this._watchedWindow)
      this._handles_window.splice(0).forEach(h => this._watchedWindow.disconnect(h));
    this._watchedWindow = null;
    this._handles_window = [];
  }

  _highlightWindow() {
    this._clearHighlight();
    this._unwatchWindow();

    const win = global.display.focus_window;
    if (this._shouldSkip(win)) return;

    const border = new St.Bin();
    border.style = `border: ${this._borderWidth}px solid ${this._borderColor}; border-radius: ${this._borderRadius}px;`;

    const rect = win.get_frame_rect();
    const inset = this._borderWidth;
    border.set_size(rect.width + inset * 2, rect.height + inset * 2);
    border.set_position(rect.x - inset, rect.y - inset);

    global.window_group.add_child(border);
    border.show();
    this._borders.push(border);

    this._watchWindow(win);

    if (!this._disableHiding) {
      const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._hideDelay, () => {
        // Drop our own id; GLib destroys the source on SOURCE_REMOVE.
        const idx = this._timeouts.indexOf(id);
        if (idx !== -1) this._timeouts.splice(idx, 1);
        this._removeAllBorders();
        return GLib.SOURCE_REMOVE;
      });
      this._timeouts.push(id);
    }
  }
}
