// TEMPORARY: works around a GNOME 49–51 regression, removed once mutter fixes
// it. Every touch point outside this file is marked "snapRestore:".
// https://gitlab.gnome.org/GNOME/mutter/-/issues/4918

import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import Mtk from 'gi://Mtk';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { plainRect, sameRect } from './rect.js';
import {
  applyFloatingRect, applyMaximizeNotify, applyTileMonitor, canRepair, clampUnmaximized,
} from './snaprestore-pure.js';
import { isEdgeFlush, isNormalWindow, monitorGeometry } from './utils.js';

// Bump or delete when mutter ships a fix. Unfixed in 51.1: tile_window() still
// sets tile mode before save_rect(). https://gitlab.gnome.org/GNOME/mutter/-/merge_requests/5449
const AFFECTED_MAJORS = [49, 50, 51];

// Window state kept across the disable() Shell runs on screen lock, for the
// next enable() only. Weak keys let closed windows drop out.
let retained = new WeakMap();

// Watches every normal window, so no snap or unsnap goes unseen.
export class snapRestoreFix {
  constructor(settings) {
    this._settings = settings;
    this._handles_display = [];
    // win -> { handles, rect: last floating rect, snap: pre-snap snapshot,
    //         mutterSaved: maximized from floating, laterId }
    this._windows = new Map();
    // New windows, until first shown: win -> cancel()
    this._pending = new Map();
    this._grabbedWindow = null;
  }

  // For an unlock that does not start snap restore: kept state would go stale.
  static forgetRetained() {
    retained = new WeakMap();
  }

  static isAffected() {
    const major = parseInt(Config.PACKAGE_VERSION.split('.')[0], 10);
    return AFFECTED_MAJORS.includes(major);
  }

  enable() {
    this._handles_display.push(
      global.display.connect('window-created', (_display, win) => this._watchWhenShown(win)));
    // Mutter saves the drag-start rect, so ignore the grabbed window's geometry mid-drag.
    let beginId = 0;
    try {
      beginId = global.display.connect('grab-op-begin', (_display, win) => { this._grabbedWindow = win; });
      const endId = global.display.connect('grab-op-end', (_display, win) => {
        this._grabbedWindow = null;
        // Mid-grab geometry was skipped, so record where the window landed.
        const state = this._windows.get(win);
        if (state) this._cacheIfFloating(win, state);
      });
      this._handles_display.push(beginId, endId);
    } catch (e) {
      // Both or neither: a begin without an end would block caching for good.
      if (beginId) global.display.disconnect(beginId);
      console.warn(`snapRestore: grab-op signals unavailable: ${e.message}`);
    }
    global.display.list_all_windows().forEach(win => this._watch(win));
    retained = new WeakMap();
  }

  disable() {
    this._handles_display.splice(0).forEach(h => global.display.disconnect(h));
    [...this._pending.values()].forEach(cancel => cancel());
    // Only a lock: after a settings toggle, changes made meanwhile went unseen.
    // isLocked is set before Shell disables extensions.
    const keep = Main.sessionMode.isLocked;
    if (!keep) retained = new WeakMap();
    for (const [win, state] of this._windows) {
      if (keep) {
        const { rect, snap, mutterSaved } = state;
        retained.set(win, { rect, snap, mutterSaved, frame: plainRect(win.get_frame_rect()), flags: flagsOf(win) });
      }
      this._unwatch(win);
    }
    this._grabbedWindow = null;
  }

  // A new window's rect counts once mutter has placed it and applied its initial state.
  // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L8746
  _watchWhenShown(win) {
    if (!isNormalWindow(win) || this._pending.has(win)) return;
    const ids = [];
    const cancel = () => {
      ids.splice(0).forEach(id => win.disconnect(id));
      this._pending.delete(win);
    };
    ids.push(win.connect('shown', () => { cancel(); this._watch(win); }));
    ids.push(win.connect('unmanaged', cancel));
    this._pending.set(win, cancel);
  }

  _watch(win) {
    if (!isNormalWindow(win) || this._windows.has(win)) return;
    const state = { handles: [], rect: null, snap: null, mutterSaved: false, laterId: 0 };
    // Reuse state from before disable() only if the window has not changed since.
    const kept = retained.get(win);
    retained.delete(win);
    if (kept && kept.flags === flagsOf(win) && sameRect(kept.frame, win.get_frame_rect()))
      Object.assign(state, { rect: kept.rect, snap: kept.snap, mutterSaved: kept.mutterSaved });
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
      applyTileMonitor(state.snap, global.display.get_monitor_index_for_rect(win.get_frame_rect()));
    this._cacheIfFloating(win, state);
  }

  _cacheIfFloating(win, state) {
    if (win === this._grabbedWindow || isEdgeFlush(win)) return;
    applyFloatingRect(state, plainRect(win.get_frame_rect()));
  }

  _onMaximizedChanged(win, state) {
    // Not the cache on unsnap: X11 has already cached mutter's stale restore rect.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3662
    const snap = applyMaximizeNotify(state, win.maximized_horizontally, win.maximized_vertically,
      () => this._takeSnapshot(win, state));
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

  _takeSnapshot(win, state) {
    // Drag tiling uses the pointer's monitor. Otherwise it is known once the tile lands.
    const frame = win.get_frame_rect();
    let tileMonitor = null;
    if (win === this._grabbedWindow)
      tileMonitor = global.display.get_current_monitor();
    else if (!sameRect(state.rect, frame))
      tileMonitor = global.display.get_monitor_index_for_rect(frame);
    const rectMonitor = monitorOf(state.rect);
    return {
      rect: state.rect,
      tileMonitor,
      monitorNow: tileMonitor,
      rectMonitor,
      rectMonitorGeo: monitorGeometry(rectMonitor),
    };
  }

  // Its geometry signals re-cache the repaired rect.
  _repair(win, snap, sizeOnly) {
    if (isEdgeFlush(win) || !canRepair(snap, monitorGeometry(snap.rectMonitor), sizeOnly)) return;

    // Mutter clamps against the monitor the window was tiled on.
    // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L3537
    const tiledOn = sizeOnly ? -1 : snap.monitorNow ?? snap.rectMonitor;
    const workArea = tiledOn >= 0
      ? win.get_work_area_for_monitor(tiledOn)
      : win.get_work_area_current_monitor();
    const { width, height } = clampUnmaximized(snap.rect, workArea);
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
  return global.display.get_monitor_index_for_rect(new Mtk.Rectangle(plainRect(rect)));
}

function flagsOf(win) {
  return (win.maximized_horizontally ? 1 : 0) | (win.maximized_vertically ? 2 : 0) |
    (win.is_fullscreen() ? 4 : 0);
}
