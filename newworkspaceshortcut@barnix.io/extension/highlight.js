// Highlight Focus — draws a temporary border around the focused window on focus change.
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { isEdgeFlush, isNormalWindow } from './utils.js';

// How often to re-check a window that GNOME Shell is still animating.
const ANIMATION_POLL_MS = 100;

export class highlightFocus {
  constructor(settings) {
    this._settings = settings;
    this._borders = [];
    this._timeouts = [];
    this._handles_display = [];
    this._handles_settings = [];
    this._handles_window = [];
    this._watchedWindow = null;
    this._laterId = 0;
    this._animationPollId = 0;
    this._drawnInset = 0;
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
    // Settings may have changed while disabled, with no handlers connected.
    this._readSettings();
    // Never draw inside a geometry signal: size-change fires mid-transition.
    // Moves are applied from a later instead. https://gitlab.gnome.org/GNOME/mutter/-/blob/50.4/src/core/window.c#L3324
    this._handles_display.push(
      global.display.connect('notify::focus-window', () => this._highlightWindow()),
    );

    for (const key of ['highlight-border-color', 'highlight-border-width', 'highlight-border-radius', 'highlight-hide-delay']) {
      this._handles_settings.push(
        this._settings.connect(`changed::${key}`, () => this._readSettings()),
      );
    }
    // Redraw so the current border gains, or drops, its hide timer.
    this._handles_settings.push(
      this._settings.connect('changed::highlight-disable-hiding', () => {
        this._readSettings();
        this._highlightWindow();
      }),
    );

    const flag = Meta.KeyBindingFlags.IGNORE_AUTOREPEAT;
    const mode = Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW;
    Main.wm.addKeybinding('highlight-keybinding', this._settings, flag, mode, () => this._highlightWindow());

    this._highlightWindow();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    this._handles_settings.splice(0).forEach(h => this._settings.disconnect(h));
    this._unwatchWindow();
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

  _clearHighlight() {
    this._removeAllBorders();
    this._removeAllTimeouts();
  }

  _watchWindow(win) {
    this._watchedWindow = win;
    this._handles_window = [
      win.connect('notify::maximized-horizontally', () => this._onStateChanged()),
      win.connect('notify::maximized-vertically', () => this._onStateChanged()),
      win.connect('notify::fullscreen', () => this._onStateChanged()),
      win.connect('position-changed', () => this._queueReposition()),
      win.connect('size-changed', () => this._queueReposition()),
    ];
  }

  // Never draw here: Wayland rects lag the ack. The next geometry change
  // re-shows it, or it would clip.
  _onStateChanged() {
    const win = this._watchedWindow;
    // Mutter notifies even when nothing changed, so check the state itself.
    if (win && isEdgeFlush(win)) this._borders.forEach(b => b.hide());
  }

  // Follows the window; never re-creates a border that auto-hide removed.
  _queueReposition() {
    if (this._laterId || this._borders.length === 0) return;
    this._laterId = global.compositor.get_laters().add(Meta.LaterType.BEFORE_REDRAW, () => {
      this._laterId = 0;
      const win = this._watchedWindow;
      const border = this._borders[0];
      if (!win || !border) return GLib.SOURCE_REMOVE;
      if (isEdgeFlush(win)) {
        border.hide();
        return GLib.SOURCE_REMOVE;
      }
      // Shell animates (un)maximize from the old rect; show once the actor gets there.
      // https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/51.1/js/ui/windowManager.js#L1332
      if (win.get_compositor_private()?.__animationInfo) {
        border.hide();
        this._pollAnimation();
        return GLib.SOURCE_REMOVE;
      }
      this._placeBorder(border, win);
      border.show();
      return GLib.SOURCE_REMOVE;
    });
  }

  _pollAnimation() {
    if (this._animationPollId) return;
    this._animationPollId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ANIMATION_POLL_MS, () => {
      this._animationPollId = 0;
      this._queueReposition();
      return GLib.SOURCE_REMOVE;
    });
  }

  // Uses the drawn inset: the border's CSS keeps its width after a settings change.
  _placeBorder(border, win) {
    const rect = win.get_frame_rect();
    const inset = this._drawnInset;
    border.set_size(rect.width + inset * 2, rect.height + inset * 2);
    border.set_position(rect.x - inset, rect.y - inset);
  }

  _unwatchWindow() {
    if (this._laterId) {
      global.compositor.get_laters().remove(this._laterId);
      this._laterId = 0;
    }
    if (this._watchedWindow)
      this._handles_window.splice(0).forEach(h => this._watchedWindow.disconnect(h));
    this._watchedWindow = null;
    this._handles_window = [];
    if (this._animationPollId) GLib.Source.remove(this._animationPollId);
    this._animationPollId = 0;
  }

  _highlightWindow() {
    this._clearHighlight();
    this._unwatchWindow();

    const win = global.display.focus_window;
    if (!isNormalWindow(win)) return;
    // With auto-hide off, an edge-flush window gets a hidden border to show on restore.
    const edgeFlush = isEdgeFlush(win);
    if (edgeFlush && !this._disableHiding) return;

    const border = new St.Bin();
    border.style = `border: ${this._borderWidth}px solid ${this._borderColor}; border-radius: ${this._borderRadius}px;`;
    this._drawnInset = this._borderWidth;

    this._placeBorder(border, win);

    global.window_group.add_child(border);
    if (edgeFlush) border.hide();
    else border.show();
    this._borders.push(border);

    this._watchWindow(win);

    if (!this._disableHiding) {
      const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._hideDelay, () => {
        // Drop our own id; GLib destroys the source on SOURCE_REMOVE.
        const idx = this._timeouts.indexOf(id);
        if (idx !== -1) this._timeouts.splice(idx, 1);
        this._removeAllBorders();
        this._unwatchWindow();
        return GLib.SOURCE_REMOVE;
      });
      this._timeouts.push(id);
    }
  }
}
