// Focus Changer — move keyboard focus between windows by geometric direction.
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

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
      w => w.get_monitor() === monitor && !w.is_hidden()
    );
  }

  _getBestCandidate(direction, monitor, activeRect, activeWin) {
    const windows = this._getWindowsOnMonitor(monitor).filter(w => w !== activeWin);
    // Most-recently-used first as a tiebreaker
    windows.sort((a, b) => b.user_time - a.user_time);

    const ax = this._centerX(activeRect);
    const ay = this._centerY(activeRect);
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
      const isVertical = direction === 'focus-changer-up' || direction === 'focus-changer-down';
      const primaryDist   = isVertical ? Math.abs(cy - ay) : Math.abs(cx - ax);
      const bestPrimaryDist = isVertical ? Math.abs(by - ay) : Math.abs(bx - ax);
      const secondaryDist  = isVertical ? Math.abs(cx - ax) : Math.abs(cy - ay);
      const bestSecondaryDist = isVertical ? Math.abs(bx - ax) : Math.abs(by - ay);

      if (primaryDist < bestPrimaryDist) best = w;
      else if (primaryDist === bestPrimaryDist && secondaryDist < bestSecondaryDist) best = w;
    }

    // If nothing found on this monitor, try the nearest monitor in that direction
    if (!best) {
      const nextMonitor = this._getAdjacentMonitor(direction, monitor, activeRect, activeWin.get_display());
      if (nextMonitor !== null) {
        const monitorRect = activeWin.get_display().get_monitor_geometry(monitor);
        return this._getBestCandidate(direction, nextMonitor, monitorRect, activeWin);
      }
    }

    return best;
  }

  // Mutter's adjacency rule (shared edge, overlap on the other axis), but picks
  // the neighbour nearest the window, not the first listed.
  // https://gitlab.gnome.org/GNOME/mutter/-/blob/51.1/src/backends/meta-logical-monitor.c#L319
  _getAdjacentMonitor(direction, activeMonitorId, activeRect, display) {
    const n = display.get_n_monitors();
    if (activeMonitorId < 0 || activeMonitorId >= n) return null;
    const a = display.get_monitor_geometry(activeMonitorId);
    const vertical = direction === 'focus-changer-up' || direction === 'focus-changer-down';
    const along = vertical ? this._centerX(activeRect) : this._centerY(activeRect);
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (i === activeMonitorId) continue;
      const g = display.get_monitor_geometry(i);
      const touches = {
        'focus-changer-up':    g.y + g.height === a.y,
        'focus-changer-down':  g.y === a.y + a.height,
        'focus-changer-left':  g.x + g.width === a.x,
        'focus-changer-right': g.x === a.x + a.width,
      }[direction];
      const lo = vertical ? g.x : g.y;
      const hi = lo + (vertical ? g.width : g.height);
      const aLo = vertical ? a.x : a.y;
      const aHi = aLo + (vertical ? a.width : a.height);
      if (!touches || hi <= aLo || lo >= aHi) continue;

      const dist = along < lo ? lo - along : along > hi ? along - hi : 0;
      if (dist < bestDist) { best = i; bestDist = dist; }
    }
    return best;
  }
}
