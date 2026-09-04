// TEMPORARY: works around a GNOME 49/50 regression, removed once mutter fixes
// it. Every touch point outside this file is marked "snapRestore:".
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import { shouldRepair } from './snaprestore-pure.js';

// Bump or delete when mutter ships a fix.
const AFFECTED_MAJORS = [49, 50];

export class snapRestoreFix {
  constructor(settings) {
    this._settings = settings;
    this._handles_display = [];
    this._handles_window = [];
    this._trackedWindow = null;
    this._floatingRects = new WeakMap();
    this._sideTiled = new WeakMap();
    this._laterId = 0;
    this._repairing = false;
    this._grabbed = false;
  }

  static isAffected() {
    const major = parseInt(Config.PACKAGE_VERSION.split('.')[0], 10);
    return AFFECTED_MAJORS.includes(major);
  }

  enable() {
    this._handles_display.push(
      global.display.connect('notify::focus-window', () => this._trackFocused()),
    );
    // Mutter saves the drag-start rect, so ignore geometry mid-drag.
    try {
      this._handles_display.push(
        global.display.connect('grab-op-begin', () => { this._grabbed = true; }),
        global.display.connect('grab-op-end', () => { this._grabbed = false; }),
      );
    } catch (e) {
      console.warn(`snapRestore: grab-op signals unavailable: ${e.message}`);
    }
    this._trackFocused();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    this._untrack();
    if (this._laterId) {
      global.compositor.get_laters().remove(this._laterId);
      this._laterId = 0;
    }
    this._grabbed = false;
  }

  _untrack() {
    if (this._trackedWindow)
      this._handles_window.splice(0).forEach(h => this._trackedWindow.disconnect(h));
    this._trackedWindow = null;
    this._handles_window = [];
  }

  _trackFocused() {
    this._untrack();
    const win = global.display.focus_window;
    if (win === null || win.window_type !== Meta.WindowType.NORMAL) return;

    this._trackedWindow = win;
    this._handles_window = [
      win.connect('size-changed', () => this._cacheIfFloating(win)),
      win.connect('position-changed', () => this._cacheIfFloating(win)),
      win.connect('notify::maximized-vertically', () => this._onMaximizedChanged(win)),
      win.connect('unmanaged', () => this._untrack()),
    ];
    this._cacheIfFloating(win);
  }

  _isFloating(win) {
    return !win.is_fullscreen() &&
           !win.maximized_horizontally &&
           !win.maximized_vertically;
  }

  _cacheIfFloating(win) {
    if (this._repairing || this._grabbed || !this._isFloating(win)) return;
    const r = win.get_frame_rect();
    this._floatingRects.set(win, {
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      monitor: win.get_monitor(),
    });
  }

  _onMaximizedChanged(win) {
    if (win.maximized_vertically) {
      // A side snap maximizes vertically only; a full maximize sets both.
      this._sideTiled.set(win, !win.maximized_horizontally);
      return;
    }
    const laters = global.compositor.get_laters();
    if (this._laterId) laters.remove(this._laterId);
    this._laterId = laters.add(Meta.LaterType.BEFORE_REDRAW, () => {
      this._laterId = 0;
      this._repair(win);
      return GLib.SOURCE_REMOVE;
    });
  }

  _repair(win) {
    if (this._trackedWindow !== win || !this._isFloating(win)) return;

    const cached = this._floatingRects.get(win);
    if (!shouldRepair(this._sideTiled.get(win), cached?.rect)) return;
    if (cached.monitor !== win.get_monitor()) return;
    this._sideTiled.delete(win);

    this._repairing = true;
    win.move_resize_frame(false, cached.rect.x, cached.rect.y,
                          cached.rect.width, cached.rect.height);
    this._repairing = false;
  }
}
