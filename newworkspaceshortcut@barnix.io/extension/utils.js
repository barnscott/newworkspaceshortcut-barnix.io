// Shared utilities for newworkspaceshortcut@barnix.io
import Meta from 'gi://Meta';

// Returns the focused window, or null.
export function getFocusWin() {
  return global.display.focus_window;
}

// Only normal application windows are tracked or highlighted.
export function isNormalWindow(win) {
  return !!win && win.window_type === Meta.WindowType.NORMAL;
}

export function plainRect(r) {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

// Fullscreen or maximized on either axis; mutter reports a side snap as vertical-only.
// https://gitlab.gnome.org/GNOME/mutter/-/issues/225
export function isEdgeFlush(win) {
  return win.is_fullscreen() || win.maximized_horizontally || win.maximized_vertically;
}
