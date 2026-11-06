// TEMPORARY: works around a GNOME 49–51 regression, removed once mutter fixes
// it. Every touch point outside this file is marked "snapRestore:".
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import { canRepair } from './snaprestore-pure.js';
import { isEdgeFlush, isNormalWindow } from './utils.js';

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
    if (!isNormalWindow(win)) return;

    this._trackedWindow = win;
    this._handles_window = [
      win.connect('size-changed', () => this._onGeometryChanged(win)),
      win.connect('position-changed', () => this._onGeometryChanged(win)),
      win.connect('notify::maximized-vertically', () => this._onMaximizedChanged(win)),
      win.connect('unmanaged', () => this._untrack()),
    ];
    // A floating window is not snapped; drop a snapshot left by an unseen unsnap.
    if (!isEdgeFlush(win)) this._preSnapRects.delete(win);
    this._cacheIfFloating(win);
  }

  // From the rect: geometry signals fire before mutter updates get_monitor().
  // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L4507
  _monitorOf(rect) {
    return global.display.get_monitor_index_for_rect(rect);
  }

  _monitorGeo(index) {
    if (index < 0 || index >= global.display.get_n_monitors()) return null;
    return plainRect(global.display.get_monitor_geometry(index));
  }

  // X11 moves the window before an unsnap is seen, so track the tile's monitor here.
  _onGeometryChanged(win) {
    const snap = this._preSnapRects.get(win);
    if (snap && win.maximized_vertically) snap.tileMonitor = this._monitorOf(win.get_frame_rect());
    this._cacheIfFloating(win);
  }

  _cacheIfFloating(win) {
    if (this._grabbed || isEdgeFlush(win)) return;
    const r = win.get_frame_rect();
    const monitor = this._monitorOf(r);
    this._floatingRects.set(win, { rect: plainRect(r), monitor, monitorGeo: this._monitorGeo(monitor) });
  }

  _onMaximizedChanged(win) {
    if (win.maximized_vertically) {
      // Maximizing a snapped window keeps its snapshot: mutter saves no rect then either.
      if (win.maximized_horizontally) return;
      // Flags change before geometry, so the cache still holds the floating rect.
      const cached = this._floatingRects.get(win);
      if (cached)
        this._preSnapRects.set(win, { ...cached, tileMonitor: this._monitorOf(win.get_frame_rect()) });
      return;
    }
    // Not the cache: X11 has already cached mutter's stale restore rect.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3662
    const preSnap = this._preSnapRects.get(win);
    if (!preSnap) return;
    this._preSnapRects.delete(win);
    // A grab shake-loose already places the window; fix only its size.
    const sizeOnly = this._grabbed;
    const laters = global.compositor.get_laters();
    if (this._laterId) laters.remove(this._laterId);
    // RESIZE laters run before BEFORE_REDRAW ones, so Highlight Focus draws the repaired rect.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/compositor/meta-later.c#L186
    this._laterId = laters.add(Meta.LaterType.RESIZE, () => {
      this._laterId = 0;
      this._repair(win, preSnap, sizeOnly);
      return GLib.SOURCE_REMOVE;
    });
  }

  // Runs even if focus moved since the unsnap. Its geometry signals re-cache the rect.
  _repair(win, preSnap, sizeOnly) {
    // Mutter drops the actor when it starts unmanaging the window.
    if (!win.get_compositor_private() || isEdgeFlush(win)) return;
    if (!canRepair(preSnap, this._monitorGeo(preSnap.monitor))) return;

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

function plainRect(r) {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}
