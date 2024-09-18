/* 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import Shell from 'gi://Shell';
import Meta from 'gi://Meta';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

// FUNCTION, move the window to the new workspace
function moveWindow(m) {
  //0. Define the WS index I want to move to
  let newIndex = getNewIndex(m);

  //1. get the Focused / active  window
  let myWin = getFocusWin();

  //2. create  new  workspace
  Main.wm.insertWorkspace(newIndex);

  //3. on the Focused Meta.Window object
  myWin.change_workspace_by_index(newIndex, false);

  //4. move me to new workspace
  let myTime = global.get_current_time();
  let ws = global.workspaceManager.get_workspace_by_index(newIndex);
  ws.activate_with_focus(myWin, myTime);
}

// FUNCTION, create an empty workspace
function emptyWS(m) {
  //0. Define the WS index I want to move to
  let newIndex = getNewIndex(m);

  //1. create  new  workspace
  Main.wm.insertWorkspace(newIndex);

  //2. move me to new workspace
  let myTime = global.get_current_time();
  let ws = global.workspaceManager.get_workspace_by_index(newIndex);
  ws.activate(myTime);
}

// FUNCTION, define the workspace # we are moving to
function getNewIndex(m){
  let myIndex = global.workspaceManager.get_active_workspace_index();
  let newIndex = myIndex + m;
  return newIndex
}

// FUNCTION, find Win that currently has shell focus
function getFocusWin(){

  let myWins = global.get_window_actors();
  let focusWin;
  myWins.forEach((winCont) => {
    let win = winCont.get_meta_window();
    let focstat = win.has_focus();
    if ( focstat ){
      focusWin = win;
    }
  });
  return focusWin;
}

function reorderWS() {

  this.left = function (moveWSTriggersOverview) {
    let ws = global.workspaceManager.get_active_workspace();
    let myIndex = global.workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex-1) >= 0){
      newIndex = myIndex-1;
      this.moveWS(ws,newIndex,moveWSTriggersOverview);
    }
  }
  this.right = function (moveWSTriggersOverview) {
    let ws = global.workspaceManager.get_active_workspace();
    let myIndex = global.workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex+1) <= (global.workspaceManager.n_workspaces-1)){
      newIndex = myIndex+1;
      this.moveWS(ws,newIndex,moveWSTriggersOverview);
    }
  }
  this.moveWS = function(ws,newIndex,moveWSTriggersOverview){
    if ( !Main.overview.visible && moveWSTriggersOverview ){
      Main.overview.toggle();
    }
    global.workspaceManager.reorder_workspace(ws, newIndex);
  }
}

class TilerToggle {
    constructor(extSettings,flag,mode) {
      this._settings = extSettings;
      this.flag = flag;
      this.mode = mode;
      this.toggle_event();
    }

    toggle_event () {
      var tiler_status_key = this._settings.get_boolean('tiler-toggle');
      if(tiler_status_key == true ){
          this.enable();
      }else{
          this.disable();
      }
    }

    enable () {
      this.wTiler = new tiler(this._settings);
      Main.wm.addKeybinding("resize-win", this._settings, this.flag, this.mode, () => {
        this.wTiler.resize_window('window-height','window-width');
      });
      Main.wm.addKeybinding("resize-win1", this._settings, this.flag, this.mode, () => {
        this.wTiler.resize_window('window-height1','window-width1');
      });
      Main.wm.addKeybinding("resize-win2", this._settings, this.flag, this.mode, () => {
        this.wTiler.resize_window('window-height2','window-width2');
      });
      Main.wm.addKeybinding("resize-win3", this._settings, this.flag, this.mode, () => {
        this.wTiler.resize_window('window-height3','window-width3');
      });
      Main.wm.addKeybinding("window-right", this._settings, this.flag, this.mode, () => {
        this.wTiler.right();
      });
      Main.wm.addKeybinding("window-left", this._settings, this.flag, this.mode, () => {
        this.wTiler.left();
      });
      Main.wm.addKeybinding("window-up", this._settings, this.flag, this.mode, () => {
        this.wTiler.up();
      });
      Main.wm.addKeybinding("window-down", this._settings, this.flag, this.mode, () => {
        this.wTiler.down();
      });
    }

    disable () {
      Main.wm.removeKeybinding("resize-win");
      Main.wm.removeKeybinding("resize-win1");
      Main.wm.removeKeybinding("resize-win2");
      Main.wm.removeKeybinding("resize-win3");
      Main.wm.removeKeybinding("window-right");
      Main.wm.removeKeybinding("window-left");
      Main.wm.removeKeybinding("window-up");
      Main.wm.removeKeybinding("window-down");
    }
  }

class tiler {
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
    let top_bar_height = this.top_bar();
    let center = top_bar_height + ((height - top_bar_height) * 0.5)
    let buffer = display_spec[2];
    let multimonitor_y_offset = display_spec[4];
    return [center,buffer,height,multimonitor_y_offset]
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

  top_bar () {
    let panelActor = Main.panel.get_actor();
    let panelheight = panelActor.get_height();
    return panelheight;
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
    let newHeight = (( displayreponse[1] - this.top_bar() ) * (this._settings.get_int(heightKey) * 0.01)) - (displayreponse[2] * 3);
  
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
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = (height_center - buffer) - window_rect['height'] + multimonitor_y_offset;
    let top_bar_height = this.top_bar();
    // if new window is above the top of the monitor-display, then
    //    ...reset y_axis inside display-monitor
    if (y_axis < top_bar_height) {
      y_axis = (buffer *2) + multimonitor_y_offset + top_bar_height;
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
  down () {
    let myWin = getFocusWin();
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = height_center + buffer + multimonitor_y_offset;

    // if bottom of window falls off the bottom of display-monitor, then
    //    ...reset y_axis so that it is inside display-monitor bourdary
    if ((y_axis+window_rect['height']) > (height+multimonitor_y_offset-buffer)) {
      y_axis = y_axis-((y_axis+window_rect['height'])-height)+multimonitor_y_offset-(buffer *2);
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
  left_edge () {
    let myWin = getFocusWin();
    let [display_width,display_height,buffer,multimonitor_x_offset,multimonitor_y_offset] = this.get_display_info(myWin)
    let window_rect = this.window_rect(myWin);
    let x_axis = (0 + buffer) + multimonitor_x_offset;
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  right_edge () { //wip
    let myWin = getFocusWin();
    let [width_center,buffer,width,multimonitor_x_offset] = this.get_width_center(myWin);
    let window_rect = this.window_rect(myWin);
    let x_axis = (width_center + buffer) + multimonitor_x_offset;
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  up_edge () { //wip
    let myWin = getFocusWin();
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = (height_center - buffer) - window_rect['height'] + multimonitor_y_offset;
    let top_bar_height = this.top_bar();
    // if new window is above the top of the monitor-display, then
    //    ...reset y_axis inside display-monitor
    if (y_axis < top_bar_height) {
      y_axis = (buffer *2) + multimonitor_y_offset + top_bar_height;
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
  down_edge () { //wip
    let myWin = getFocusWin();
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = height_center + buffer + multimonitor_y_offset;

    // if bottom of window falls off the bottom of display-monitor, then
    //    ...reset y_axis so that it is inside display-monitor bourdary
    if ((y_axis+window_rect['height']) > (height+multimonitor_y_offset-buffer)) {
      y_axis = y_axis-((y_axis+window_rect['height'])-height)+multimonitor_y_offset-(buffer *2);
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
}

export default class newWorkspaceShortcuts extends Extension {

  enable() {
    this.rWS = new reorderWS();
    let mode = Shell.ActionMode.ALL;
    let flag = Meta.KeyBindingFlags.NONE;
    this._settings = this.getSettings();
    let m,moveWSTriggersOverview;

    // Shortcuts for moving a window
    Main.wm.addKeybinding("move-window-to-right-workspace", this._settings, flag, mode, () => {
      moveWindow(m=1);
    });
    Main.wm.addKeybinding("move-window-to-left-workspace", this._settings, flag, mode, () => {
      moveWindow(m=0);
    });
    
    // Shortcuts for creating an empty workspace
    Main.wm.addKeybinding("empty-workspace-right", this._settings, flag, mode, () => {
      emptyWS(m=1);
    });
    Main.wm.addKeybinding("empty-workspace-left", this._settings, flag, mode, () => {
      emptyWS(m=0);
    });

    // Shortcuts for moving a workspace
    Main.wm.addKeybinding("workspace-right", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-workspace-triggers-overview');
      this.rWS.right(moveWSTriggersOverview);
    });
    Main.wm.addKeybinding("workspace-left", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-workspace-triggers-overview');
      this.rWS.left(moveWSTriggersOverview);
    });

    this._tilerToggle = new TilerToggle(this._settings,flag,mode);
    this._settings.connect(`changed::tiler-toggle`,() => {
      this._tilerToggle.toggle_event();
    });

  }

  disable() {
    Main.wm.removeKeybinding("move-window-to-right-workspace");
    Main.wm.removeKeybinding("move-window-to-left-workspace");
    Main.wm.removeKeybinding("empty-workspace-right");
    Main.wm.removeKeybinding("empty-workspace-left");
    Main.wm.removeKeybinding("workspace-right");
    Main.wm.removeKeybinding("workspace-left");
    this._tilerToggle.disable();
    this.rWS = null;
    this.wTiler = null;
    this._settings = null;
  }
}
