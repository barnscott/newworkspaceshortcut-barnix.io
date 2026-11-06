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
