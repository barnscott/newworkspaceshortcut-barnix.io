// Focus Changer — move keyboard focus between windows by geometric direction.
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { isVertical, rankAdjacentMonitors } from './focus-pure.js';
import { isNormalWindow, monitorGeometry } from './utils.js';

const DIRECTIONS = ['focus-changer-up', 'focus-changer-down', 'focus-changer-left', 'focus-changer-right'];

export class focusChanger {
  constructor(settings) {
    this._settings = settings;
    this._wm = global.workspace_manager;
  }

  enable() {
    for (const dir of DIRECTIONS) {
      Main.wm.addKeybinding(dir, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, () => this._changeFocus(dir));
    }
  }

  disable() {
    for (const dir of DIRECTIONS) {
      Main.wm.removeKeybinding(dir);
    }
  }

  _changeFocus(direction) {
    const { win, rect } = this._getFocusedWindow();
    if (!win) return;
    const candidate = this._getBestCandidate(direction, win.get_monitor(), rect, win);
    if (candidate) candidate.activate(global.get_current_time());
  }

  _getFocusedWindow() {
    for (const win of this._wm.get_active_workspace().list_windows()) {
      if (win.has_focus()) return { win, rect: win.get_frame_rect() };
    }
    return { win: null, rect: null };
  }

  _centerX(rect) { return rect.x + rect.width  / 2; }
  _centerY(rect) { return rect.y + rect.height / 2; }

  _getWindowsOnMonitor(monitor) {
    return this._wm.get_active_workspace().list_windows().filter(
      w => isCandidate(w) && w.get_monitor() === monitor && !w.is_hidden()
    );
  }

  _bestOnMonitor(direction, monitor, activeRect, activeWin) {
    const windows = this._getWindowsOnMonitor(monitor).filter(w => w !== activeWin);
    // Most-recently-used first as a tiebreaker
    windows.sort((a, b) => b.user_time - a.user_time);

    const ax = this._centerX(activeRect);
    const ay = this._centerY(activeRect);
    const vertical = isVertical(direction);
    let best = null;

    for (const w of windows) {
      const r = w.get_frame_rect();
      const cx = this._centerX(r);
      const cy = this._centerY(r);

      const inDirection = (
        (direction === 'focus-changer-up'    && cy < ay) ||
        (direction === 'focus-changer-down'  && cy > ay) ||
        (direction === 'focus-changer-left'  && cx < ax) ||
        (direction === 'focus-changer-right' && cx > ax)
      );
      if (!inDirection) continue;

      if (!best) { best = w; continue; }

      const br = best.get_frame_rect();
      const bx = this._centerX(br);
      const by = this._centerY(br);

      // Primary axis: closer along the movement direction
      // Secondary axis: closer along the perpendicular, prefer same perpendicular position
      const primaryDist   = vertical ? Math.abs(cy - ay) : Math.abs(cx - ax);
      const bestPrimaryDist = vertical ? Math.abs(by - ay) : Math.abs(bx - ax);
      const secondaryDist  = vertical ? Math.abs(cx - ax) : Math.abs(cy - ay);
      const bestSecondaryDist = vertical ? Math.abs(bx - ax) : Math.abs(by - ay);

      if (primaryDist < bestPrimaryDist) best = w;
      else if (primaryDist === bestPrimaryDist && secondaryDist < bestSecondaryDist) best = w;
    }

    return best;
  }

  // This monitor first, then monitors beyond the edge breadth-first, nearest first.
  _getBestCandidate(direction, monitor, activeRect, activeWin) {
    const best = this._bestOnMonitor(direction, monitor, activeRect, activeWin);
    if (best) return best;

    const vertical = isVertical(direction);
    const searched = new Set([monitor]);
    let frontier = [monitor];
    while (frontier.length) {
      const level = [];
      for (const from of frontier) {
        const m = monitorGeometry(from);
        if (!m) continue;
        // Measure along travel from the monitor before, across it from the window.
        const ref = vertical
          ? { x: activeRect.x, width: activeRect.width, y: m.y, height: m.height }
          : { x: m.x, width: m.width, y: activeRect.y, height: activeRect.height };
        for (const next of this._getAdjacentMonitors(direction, from, activeRect)) {
          if (searched.has(next)) continue;
          searched.add(next);
          level.push({ next, ref });
        }
      }
      for (const { next, ref } of level) {
        const found = this._bestOnMonitor(direction, next, ref, activeWin);
        if (found) return found;
      }
      frontier = level.map(l => l.next);
    }
    return null;
  }

  _getAdjacentMonitors(direction, activeMonitorId, activeRect) {
    const monitors = Array.from({ length: global.display.get_n_monitors() }, (_, i) => monitorGeometry(i));
    const along = isVertical(direction) ? this._centerX(activeRect) : this._centerY(activeRect);
    return rankAdjacentMonitors(direction, activeMonitorId, monitors, along);
  }
}

// Apps, dialogs and tool windows. Mutter forces skip_taskbar on the latter two,
// so only a normal window's counts.
// https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/core/window.c#L6030
const CANDIDATE_TYPES = new Set([
  Meta.WindowType.DIALOG, Meta.WindowType.MODAL_DIALOG, Meta.WindowType.UTILITY,
]);

function isCandidate(win) {
  return isNormalWindow(win) ? !win.skip_taskbar : CANDIDATE_TYPES.has(win.window_type);
}
