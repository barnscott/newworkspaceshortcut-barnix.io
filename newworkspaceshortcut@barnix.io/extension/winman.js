// Window Management
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { getFocusWin } from './utils.js';

// Buffer multipliers: SIDES accounts for both sides, WITH_OUTER adds one extra for even outer-edge gaps
const BUFFER_SIDES = 2;
const BUFFER_WITH_OUTER = 3;
const PERCENT_TO_RATIO = 0.01;

export class windowManager {
    constructor(extSettings) {
      this._settings = extSettings;
    }

    _withFocusedWindow(fn) {
      const win = getFocusWin();
      if (!win) return;
      fn(win);
    }

    get_display_info(myWin) {
      const geo = myWin.get_display().get_monitor_geometry(myWin.get_monitor());
      return {
        width: geo.width,
        height: geo.height,
        buffer: this._settings.get_int('window-buffer'),
        x: geo.x,
        y: geo.y,
      };
    }

    get_height_center(myWin) {
      const d = this.get_display_info(myWin);
      const top_bar_height = this.top_bar(this.window_rect(myWin));
      return {
        center: top_bar_height + (d.height - top_bar_height) * 0.5,
        buffer: d.buffer,
        height: d.height,
        y_offset: d.y,
        top_bar_height,
      };
    }

    get_width_center(myWin) {
      const d = this.get_display_info(myWin);
      return {
        center: d.width * 0.5,
        buffer: d.buffer,
        width: d.width,
        x_offset: d.x,
      };
    }

    window_rect(myWin) {
      return myWin.get_frame_rect();
    }

    top_bar(window_rect) {
      const panelActor = Main.panel.get_actor();
      let panelheight = 0;
      let topBarPref = this._settings.get_string('top-bar-pref') || 'primary';
      topBarPref = topBarPref.toLowerCase();
      if (!['always', 'primary', 'never'].includes(topBarPref))
        topBarPref = 'primary';

      if (topBarPref === 'primary' && this.isActiveWindowOnPrimaryMonitor(window_rect))
        panelheight += panelActor.get_height();
      else if (topBarPref === 'always')
        panelheight += panelActor.get_height();

      return panelheight;
    }

    isActiveWindowOnPrimaryMonitor(window_rect) {
      const p = Main.layoutManager.primaryMonitor;
      return (
        window_rect.x >= p.x &&
        window_rect.x + window_rect.width  <= p.x + p.width &&
        window_rect.y >= p.y &&
        window_rect.y + window_rect.height <= p.y + p.height
      );
    }

    resize_window(heightKey, widthKey) {
      this._withFocusedWindow(myWin => {
        const window_rect = this.window_rect(myWin);
        const d = this.get_display_info(myWin);
        // Display dimension * user-defined percentage, minus buffer × BUFFER_WITH_OUTER
        // (both sides of window plus outer-edge padding so gaps are even)
        const newWidth  = (d.width  * (this._settings.get_int(widthKey)  * PERCENT_TO_RATIO)) - (d.buffer * BUFFER_WITH_OUTER);
        const newHeight = ((d.height - this.top_bar(window_rect)) * (this._settings.get_int(heightKey) * PERCENT_TO_RATIO)) - (d.buffer * BUFFER_WITH_OUTER);
        myWin.move_resize_frame(true, window_rect.x, window_rect.y, newWidth, newHeight);
      });
    }

    // Window Relocation functions
    left() {
      this._withFocusedWindow(myWin => {
        const { center, buffer, x_offset } = this.get_width_center(myWin);
        const window_rect = this.window_rect(myWin);
        const x_axis = (center - buffer) - window_rect.width + x_offset;
        myWin.move_frame(true, x_axis, window_rect.y);
      });
    }

    right() {
      this._withFocusedWindow(myWin => {
        const { center, buffer, x_offset } = this.get_width_center(myWin);
        const window_rect = this.window_rect(myWin);
        const x_axis = (center + buffer) + x_offset;
        myWin.move_frame(true, x_axis, window_rect.y);
      });
    }

    up() {
      this._withFocusedWindow(myWin => {
        const { center, buffer, y_offset, top_bar_height } = this.get_height_center(myWin);
        const window_rect = this.window_rect(myWin);
        let y_axis = (center - buffer) - window_rect.height + y_offset;
        // if new position is above the top of the monitor, clamp inside display
        if (y_axis < top_bar_height)
          y_axis = (buffer * BUFFER_SIDES) + y_offset + top_bar_height;
        myWin.move_frame(true, window_rect.x, y_axis);
      });
    }

    down() {
      this._withFocusedWindow(myWin => {
        const { center, buffer, height, y_offset } = this.get_height_center(myWin);
        const window_rect = this.window_rect(myWin);
        let y_axis = Math.round(center) + buffer + y_offset;
        // if bottom of window falls off the bottom of display, clamp inside display
        if ((y_axis + window_rect.height) > (height + y_offset - buffer))
          y_axis = y_axis - ((y_axis + window_rect.height) - height) + y_offset - (buffer * BUFFER_SIDES);
        myWin.move_frame(true, window_rect.x, y_axis);
      });
    }

    left_edge() {
      this._withFocusedWindow(myWin => {
        const { buffer, x } = this.get_display_info(myWin);
        const window_rect = this.window_rect(myWin);
        const x_axis = (buffer * BUFFER_SIDES) + x;
        myWin.move_frame(true, x_axis, window_rect.y);
      });
    }

    right_edge() {
      this._withFocusedWindow(myWin => {
        const { width, buffer, x } = this.get_display_info(myWin);
        const window_rect = this.window_rect(myWin);
        const x_axis = width - window_rect.width - (buffer * BUFFER_SIDES) + x;
        myWin.move_frame(true, x_axis, window_rect.y);
      });
    }

    up_edge() {
      this._withFocusedWindow(myWin => {
        const { buffer, y } = this.get_display_info(myWin);
        const window_rect = this.window_rect(myWin);
        const top_bar_height = this.top_bar(window_rect);
        const y_axis = (buffer * BUFFER_SIDES) + top_bar_height + y;
        myWin.move_frame(true, window_rect.x, y_axis);
      });
    }

    down_edge() {
      this._withFocusedWindow(myWin => {
        const { height, buffer, y } = this.get_display_info(myWin);
        const window_rect = this.window_rect(myWin);
        const y_axis = height - window_rect.height - (buffer * BUFFER_SIDES) + y;
        myWin.move_frame(true, window_rect.x, y_axis);
      });
    }
}
