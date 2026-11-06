// Shared utilities for newworkspaceshortcut@barnix.io
import Meta from 'gi://Meta';
import { plainRect } from './rect.js';

// Returns the focused window, or null.
export function getFocusWin() {
  return global.display.focus_window;
}

// Only normal application windows are tracked or highlighted.
export function isNormalWindow(win) {
  return !!win && win.window_type === Meta.WindowType.NORMAL;
}

// A monitor's geometry as a plain rect, or null for an invalid index.
export function monitorGeometry(index) {
  if (index < 0 || index >= global.display.get_n_monitors()) return null;
  return plainRect(global.display.get_monitor_geometry(index));
}

// Fullscreen or maximized on either axis; mutter reports a side snap as vertical-only.
// https://gitlab.gnome.org/GNOME/mutter/-/issues/225
export function isEdgeFlush(win) {
  return win.is_fullscreen() || win.maximized_horizontally || win.maximized_vertically;
}
