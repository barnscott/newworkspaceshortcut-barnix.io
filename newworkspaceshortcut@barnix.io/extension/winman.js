// Window Management
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { getFocusWin } from '../extension.js';

export const windowManager = class windowManager {
    constructor(extSettings) {
      this._settings = extSettings;
    }
  
    get_display_info (myWin){
      let mydisplay = myWin.get_display();
      let monitor_geo = mydisplay.get_monitor_geometry(mydisplay.get_current_monitor());
      let buffer = this._settings.get_int('window-buffer');
      return [monitor_geo.width,monitor_geo.height,buffer,monitor_geo.x,monitor_geo.y]
    }
    get_height_center (myWin){
      let display_spec = this.get_display_info(myWin)
      let height = display_spec[1];
      let window_rect = this.window_rect(myWin);
      let top_bar_height = this.top_bar(window_rect);
      let center = top_bar_height + ((height - top_bar_height) * 0.5);
      let buffer = display_spec[2];
      let multimonitor_y_offset = display_spec[4];
      return [center,buffer,height,multimonitor_y_offset,top_bar_height]
    }
    get_width_center (myWin){
      let display_spec = this.get_display_info(myWin)
      let width = display_spec[0];
      let center = width * 0.5;
      let buffer = display_spec[2];
      let multimonitor_x_offset = display_spec[3];
      return [center,buffer,width,multimonitor_x_offset]
    }
  
    window_rect (myWin) {
      let rect = myWin.get_frame_rect();
      // rect is an object that contains: x,y,width,height
      return rect
    }
  
    top_bar (window_rect) {
      let panelActor = Main.panel.get_actor();
      let panelheight = 0;
      let topBarPref = this._settings.get_string('top-bar-pref');

      // If undefined, set to default value
      if (!topBarPref) {
        topBarPref = "primary";
      }

      // Set it lower-case
      topBarPref = topBarPref.toLowerCase();

      // Available options: primary (default), always, never
      // If invalid value, reset to primary (default)
      if (!["always", "primary", "never"].includes(topBarPref)) {
        topBarPref = "primary";
      }

      // If Primary
      if (topBarPref == "primary" && this.isActiveWindowOnPrimaryMonitor(window_rect)) {
        panelheight =+ panelActor.get_height();
      }

      // If Always
      if (topBarPref == "always") {
        panelheight =+ panelActor.get_height();
      }

      // If "never", then proceed without modifying default of initialization
      return panelheight;
    }

    isActiveWindowOnPrimaryMonitor (window_rect) {
      // Get the primary monitor
      let primaryMonitor = Main.layoutManager.primaryMonitor;

      // Check if the window's rectangle intersects with the primary monitor
      let isOnPrimary =
          window_rect.x >= primaryMonitor.x &&
          window_rect.x + window_rect.width <= primaryMonitor.x + primaryMonitor.width &&
          window_rect.y >= primaryMonitor.y &&
          window_rect.y + window_rect.height <= primaryMonitor.y + primaryMonitor.height;

      return isOnPrimary;
    }
  
    resize_window (heightKey,widthKey) {
      // get the Focused / active  window
      let myWin = getFocusWin();
      let window_rect = this.window_rect(myWin);
    
      // determine 45% of display height
      let displayreponse = this.get_display_info(myWin);
      // Display-width * user-defined-window-width, then minus Buffer (multiplied by 3 to account for trimming both sides of window, plus the extra padding for outer-edge so gaps are even)
      let newWidth = (displayreponse[0] * (this._settings.get_int(widthKey) * 0.01)) - (displayreponse[2] * 3);
      // Display-height (minus the top-bar) * user-defined-window-height, then minus Buffer (multiplied by 3 to account for trimming both sides of window, plus the extra padding for outer-edge so gaps are even)
      let newHeight = (( displayreponse[1] - this.top_bar(window_rect) ) * (this._settings.get_int(heightKey) * 0.01)) - (displayreponse[2] * 3);
    
      // modify window size
      myWin.move_resize_frame(true, window_rect.x, window_rect.y, newWidth, newHeight);
    }
  
    // Window Relocation functions
    left () {
      let myWin = getFocusWin();
      let [width_center,buffer,width,multimonitor_x_offset] = this.get_width_center(myWin);
      let window_rect = this.window_rect(myWin);
      let x_axis = (width_center - buffer) - window_rect['width'] + multimonitor_x_offset;
      myWin.move_frame(true, x_axis, window_rect['y']);
    }
    right () {
      let myWin = getFocusWin();
      let [width_center,buffer,width,multimonitor_x_offset] = this.get_width_center(myWin);
      let window_rect = this.window_rect(myWin);
      let x_axis = (width_center + buffer) + multimonitor_x_offset;
      myWin.move_frame(true, x_axis, window_rect['y']);
    }
    up () {
      let myWin = getFocusWin();
      let [height_center,buffer,height,multimonitor_y_offset,top_bar_height] = this.get_height_center(myWin);
      let window_rect = this.window_rect(myWin);
      let y_axis = (height_center - buffer) - window_rect['height'] + multimonitor_y_offset;
      // if new window is above the top of the monitor-display, then
      //    ...reset y_axis inside display-monitor
      if (y_axis < top_bar_height) {
        y_axis = (buffer *2) + multimonitor_y_offset + top_bar_height;
      }
      myWin.move_frame(true,window_rect['x'],y_axis);
    }
    down () {
      let myWin = getFocusWin();
      let [height_center,buffer,height,multimonitor_y_offset,top_bar_height] = this.get_height_center(myWin);
      let window_rect = this.window_rect(myWin);
      let y_axis = Math.round(height_center) + buffer + multimonitor_y_offset;
  
      // if bottom of window falls off the bottom of display-monitor, then
      //    ...reset y_axis so that it is inside display-monitor bourdary
      if ((y_axis+window_rect['height']) > (height+multimonitor_y_offset-buffer)) {
        y_axis = y_axis-((y_axis+window_rect['height'])-height)+multimonitor_y_offset-(buffer *2);
      }
      myWin.move_frame(true,window_rect['x'],y_axis);
    }
    left_edge () {
      let myWin = getFocusWin();
      let [display_width,display_height,buffer,multimonitor_x_offset,multimonitor_y_offset] = this.get_display_info(myWin);
      let window_rect = this.window_rect(myWin);
      let x_axis = (buffer*2) + multimonitor_x_offset;
      myWin.move_frame(true, x_axis, window_rect['y']);
    }
    right_edge () {
      let myWin = getFocusWin();
      let [display_width,display_height,buffer,multimonitor_x_offset,multimonitor_y_offset] = this.get_display_info(myWin);
      let window_rect = this.window_rect(myWin);
      let x_axis = display_width - window_rect['width'] - (buffer*2) + multimonitor_x_offset;
      myWin.move_frame(true, x_axis, window_rect['y']);
    }
    up_edge () {
      let myWin = getFocusWin();
      let [display_width,display_height,buffer,multimonitor_x_offset,multimonitor_y_offset] = this.get_display_info(myWin);
      let window_rect = this.window_rect(myWin);
      let top_bar_height = this.top_bar(window_rect);
      let y_axis = (buffer*2) + top_bar_height + multimonitor_y_offset;
      myWin.move_frame(true,window_rect['x'],y_axis);
    }
    down_edge () {
      let myWin = getFocusWin();
      let [display_width,display_height,buffer,multimonitor_x_offset,multimonitor_y_offset] = this.get_display_info(myWin);
      let window_rect = this.window_rect(myWin);
      let y_axis = display_height - window_rect['height'] - (buffer*2) + multimonitor_y_offset;
  
      // let y_axis = height_center + buffer + multimonitor_y_offset;
      myWin.move_frame(true,window_rect['x'],y_axis);
    }
}