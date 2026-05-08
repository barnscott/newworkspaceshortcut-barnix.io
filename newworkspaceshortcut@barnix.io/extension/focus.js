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
      const nextMonitor = this._getAdjacentMonitor(direction, monitor, activeWin);
      if (nextMonitor !== null) {
        const monitorRect = activeWin.get_display().get_monitor_geometry(monitor);
        return this._getBestCandidate(direction, nextMonitor, monitorRect, activeWin);
      }
    }

    return best;
  }

  _getAdjacentMonitor(direction, activeMonitorId, activeWin) {
    const display = activeWin.get_display();
    const n = display.get_n_monitors();
    const activeGeo = display.get_monitor_geometry(activeMonitorId);
    let best = null;
    let bestDist = Infinity;

    for (let i = 0; i < n; i++) {
      if (i === activeMonitorId) continue;
      const geo = display.get_monitor_geometry(i);
      let qualifies = false;
      let dist = 0;

      if (direction === 'focus-changer-up'    && geo.y < activeGeo.y) { qualifies = true; dist = activeGeo.y - geo.y; }
      if (direction === 'focus-changer-down'  && geo.y > activeGeo.y) { qualifies = true; dist = geo.y - activeGeo.y; }
      if (direction === 'focus-changer-left'  && geo.x < activeGeo.x) { qualifies = true; dist = activeGeo.x - geo.x; }
      if (direction === 'focus-changer-right' && geo.x > activeGeo.x) { qualifies = true; dist = geo.x - activeGeo.x; }

      if (qualifies && dist < bestDist) { best = i; bestDist = dist; }
    }

    return best;
  }
}
