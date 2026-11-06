// TEMPORARY: works around a GNOME 49–51 regression, removed once mutter fixes
// it. Every touch point outside this file is marked "snapRestore:".
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import { canRepair, takesSnapshot } from './snaprestore-pure.js';
import { isEdgeFlush, isNormalWindow, plainRect } from './utils.js';

// Bump or delete when mutter ships a fix. Unfixed in 51.1: tile_window() still
// sets tile mode before save_rect(). https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/5449
const AFFECTED_MAJORS = [49, 50, 51];

// Watches every normal window, so no snap or unsnap goes unseen.
export class snapRestoreFix {
  constructor(settings) {
    this._settings = settings;
    this._handles_display = [];
    // win -> { handles, rect: last floating rect, snap: pre-snap snapshot, laterId }
    this._windows = new Map();
    this._grabbedWindow = null;
  }

  static isAffected() {
    const major = parseInt(Config.PACKAGE_VERSION.split('.')[0], 10);
    return AFFECTED_MAJORS.includes(major);
  }

  enable() {
    this._handles_display.push(
      global.display.connect('window-created', (_display, win) => this._watch(win)));
    // Mutter saves the drag-start rect, so ignore the grabbed window's geometry mid-drag.
    try {
      this._handles_display.push(
        global.display.connect('grab-op-begin', (_display, win) => { this._grabbedWindow = win; }));
      this._handles_display.push(
        global.display.connect('grab-op-end', (_display, win) => {
          this._grabbedWindow = null;
          // Mid-grab geometry was skipped, so record where the window landed.
          const state = this._windows.get(win);
          if (state) this._cacheIfFloating(win, state);
        }));
    } catch (e) {
      console.warn(`snapRestore: grab-op signals unavailable: ${e.message}`);
    }
    global.display.list_all_windows().forEach(win => this._watch(win));
  }

  // Drops all state, so re-enabling never replays pre-toggle geometry.
  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    [...this._windows.keys()].forEach(win => this._unwatch(win));
    this._grabbedWindow = null;
  }

  _watch(win) {
    if (!isNormalWindow(win) || this._windows.has(win)) return;
    const state = { handles: [], rect: null, snap: null, laterId: 0 };
    this._windows.set(win, state);
    state.handles = [
      win.connect('size-changed', () => this._onGeometryChanged(win, state)),
      win.connect('position-changed', () => this._onGeometryChanged(win, state)),
      win.connect('notify::maximized-vertically', () => this._onMaximizedChanged(win, state)),
      win.connect('unmanaged', () => this._unwatch(win)),
    ];
    this._cacheIfFloating(win, state);
  }

  _unwatch(win) {
    const state = this._windows.get(win);
    if (!state) return;
    state.handles.forEach(h => win.disconnect(h));
    if (state.laterId) global.compositor.get_laters().remove(state.laterId);
    if (win === this._grabbedWindow) this._grabbedWindow = null;
    this._windows.delete(win);
  }

  // X11 moves the window before an unsnap is seen, so track the tile's monitor here.
  _onGeometryChanged(win, state) {
    if (state.snap && win.maximized_vertically)
      state.snap.tileMonitor = monitorOf(win.get_frame_rect());
    this._cacheIfFloating(win, state);
  }

  _cacheIfFloating(win, state) {
    if (win === this._grabbedWindow || isEdgeFlush(win)) return;
    state.rect = plainRect(win.get_frame_rect());
  }

  _onMaximizedChanged(win, state) {
    if (win.maximized_vertically) {
      if (!state.rect || !takesSnapshot(win.maximized_horizontally, true, state.snap !== null)) return;
      // Flags change before geometry, so the cache still holds the floating rect.
      const monitor = monitorOf(new Mtk.Rectangle(state.rect));
      state.snap = {
        rect: state.rect,
        monitor,
        monitorGeo: monitorGeo(monitor),
        tileMonitor: monitorOf(win.get_frame_rect()),
      };
      return;
    }
    // Not the cache: X11 has already cached mutter's stale restore rect.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3662
    const snap = state.snap;
    state.snap = null;
    if (!snap) return;
    // A grab shake-loose already places the window; fix only its size.
    const sizeOnly = win === this._grabbedWindow;
    const laters = global.compositor.get_laters();
    if (state.laterId) laters.remove(state.laterId);
    // The resize phase, before BEFORE_REDRAW laters: an X11 border never sees the stale rect.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/compositor/meta-later.c#L186
    state.laterId = laters.add(Meta.LaterType.RESIZE, () => {
      state.laterId = 0;
      this._repair(win, snap, sizeOnly);
      return GLib.SOURCE_REMOVE;
    });
  }

  // Its geometry signals re-cache the repaired rect.
  _repair(win, snap, sizeOnly) {
    if (isEdgeFlush(win) || !canRepair(snap, monitorGeo(snap.monitor))) return;

    const { width, height } = snap.rect;
    let { x, y } = snap.rect;
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

// From the rect: geometry signals fire before mutter updates get_monitor().
// https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L4507
function monitorOf(rect) {
  return global.display.get_monitor_index_for_rect(rect);
}

function monitorGeo(index) {
  if (index < 0 || index >= global.display.get_n_monitors()) return null;
  return plainRect(global.display.get_monitor_geometry(index));
}
