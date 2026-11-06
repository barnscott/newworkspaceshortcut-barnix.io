// TEMPORARY: works around a GNOME 49–51 regression, removed once mutter fixes
// it. Every touch point outside this file is marked "snapRestore:".
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import { shouldRepair } from './snaprestore-pure.js';

// Bump or delete when mutter ships a fix. Unfixed in 51.1: tile_window() still
// sets tile mode before save_rect(). https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/5449
const AFFECTED_MAJORS = [49, 50, 51];

export class snapRestoreFix {
  constructor(settings) {
    this._settings = settings;
    this._handles_display = [];
    this._handles_window = [];
    this._trackedWindow = null;
    this._floatingRects = new WeakMap();
    this._preSnapRects = new WeakMap();
    this._laterId = 0;
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
        global.display.connect('grab-op-end', () => {
          this._grabbed = false;
          // Mid-grab geometry was skipped, so record where the window landed.
          if (this._trackedWindow) this._cacheIfFloating(this._trackedWindow);
        }),
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
    // Toggling the setting reuses this instance; never replay pre-toggle geometry.
    this._floatingRects = new WeakMap();
    this._preSnapRects = new WeakMap();
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
    // A floating window is not snapped; drop a snapshot left by an unseen unsnap.
    if (this._isFloating(win)) this._preSnapRects.delete(win);
    this._cacheIfFloating(win);
  }

  _isFloating(win) {
    return !win.is_fullscreen() &&
           !win.maximized_horizontally &&
           !win.maximized_vertically;
  }

  _cacheIfFloating(win) {
    if (this._grabbed || !this._isFloating(win)) return;
    const r = win.get_frame_rect();
    this._floatingRects.set(win, {
      rect: { x: r.x, y: r.y, width: r.width, height: r.height },
      monitor: win.get_monitor(),
    });
  }

  _onMaximizedChanged(win) {
    if (win.maximized_vertically) {
      // A side snap maximizes vertically only; a full maximize sets both.
      // Flags change before geometry, so the cache still holds the floating rect.
      if (win.maximized_horizontally) this._preSnapRects.delete(win);
      else this._preSnapRects.set(win, this._floatingRects.get(win));
      return;
    }
    // Read the snapshot, not the cache: X11 has already cached mutter's stale
    // restore rect by now. https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3662
    const wasSideTiled = this._preSnapRects.has(win);
    const preSnap = this._preSnapRects.get(win);
    this._preSnapRects.delete(win);
    // A grab shake-loose already places the window; fix only its size.
    const sizeOnly = this._grabbed;
    const laters = global.compositor.get_laters();
    if (this._laterId) laters.remove(this._laterId);
    this._laterId = laters.add(Meta.LaterType.BEFORE_REDRAW, () => {
      this._laterId = 0;
      this._repair(win, wasSideTiled, preSnap, sizeOnly);
      return GLib.SOURCE_REMOVE;
    });
  }

  // The geometry signals this triggers re-cache the repaired rect.
  _repair(win, wasSideTiled, preSnap, sizeOnly) {
    if (this._trackedWindow !== win || !this._isFloating(win)) return;
    if (!shouldRepair(wasSideTiled, preSnap?.rect)) return;
    if (preSnap.monitor !== win.get_monitor()) return;

    const { width, height } = preSnap.rect;
    let { x, y } = preSnap.rect;
    if (sizeOnly) {
      // Keep the pointer at the same relative spot, as mutter's drag anchor does.
      // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/compositor/meta-window-drag.c#L1289
      const cur = win.get_frame_rect();
      const [px, py] = global.get_pointer();
      x = Math.round(px - width * (px - cur.x) / cur.width);
      y = Math.round(py - height * (py - cur.y) / cur.height);
    }
    win.move_resize_frame(false, x, y, width, height);
  }
}
