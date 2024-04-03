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

// const TilerToggle = GObject.registerClass(
class TilerToggle {
    _init() {
      // this._settings = this.getSettings();
      // tiler_status_key = this._settings.get_boolean('tiler-toggle');
      this._settings.connect(`changed::tiler-toggle'`,() => this._toggle_event());
    }

    _toggle_event (){
      var tiler_status_key = this._settings.get_boolean('tiler-toggle');
      if(tiler_status_key == true ){
          this._enable();
      }else{
          this._disable();
      }
    }

    _enable () {

      this.wTiler = new tiler();

      // Shortcuts for resizing window
      Main.wm.addKeybinding("resize-win", this._settings, flag, mode, () => {
        this.wTiler.resize_window();
      });

      // Shortcuts for sliding window
      Main.wm.addKeybinding("window-right", this._settings, flag, mode, () => {
        this.wTiler.right();
      });
      Main.wm.addKeybinding("window-left", this._settings, flag, mode, () => {
        this.wTiler.left();
      });
      Main.wm.addKeybinding("window-up", this._settings, flag, mode, () => {
        this.wTiler.up();
      });
      Main.wm.addKeybinding("window-down", this._settings, flag, mode, () => {
        this.wTiler.down();
      });
    }

    _disable () {
      Main.wm.removeKeybinding("resize-win");
      Main.wm.removeKeybinding("window-right");
      Main.wm.removeKeybinding("window-left");
      Main.wm.removeKeybinding("window-up");
      Main.wm.removeKeybinding("window-down");
    }
  }
// )

function tiler(){

  // Display constructor
  this.get_display_info = function (myWin){
    let mydisplay = myWin.get_display();
    let monitor_geo = mydisplay.get_monitor_geometry(mydisplay.get_current_monitor());
    let buffer = monitor_geo.height * 0.005
    return [monitor_geo.width,monitor_geo.height,buffer,monitor_geo.x,monitor_geo.y]
  }
  this.get_height_center = function (myWin){
    let display_spec = this.get_display_info(myWin)
    let height = display_spec[1];
    let center = height * 0.5;
    let buffer = display_spec[2];
    let multimonitor_y_offset = display_spec[4];
    return [center,buffer,height,multimonitor_y_offset]
  }
  this.get_width_center = function (myWin){
    let display_spec = this.get_display_info(myWin)
    let width = display_spec[0];
    let center = width * 0.5;
    let buffer = display_spec[2];
    let multimonitor_x_offset = display_spec[3];
    return [center,buffer,width,multimonitor_x_offset]
  }

  this.window_rect = function (myWin) {
    let rect = myWin.get_frame_rect();
    // rect is an object that contains: x,y,width,height
    return rect
  }

  this.resize_window = function () {
    // get the Focused / active  window
    let myWin = getFocusWin();
    let window_rect = this.window_rect(myWin);
  
    // determine 45% of display height
    let displayreponse = this.get_display_info(myWin);
    let newWidth = displayreponse[0] * 0.40;
    let newHeight = displayreponse[1] * 0.45;
  
    // modify window size
    myWin.move_resize_frame(true, window_rect.x, window_rect.y, newWidth, newHeight);
  }

  // Window Relocation functions
  this.left = function () {
    let myWin = getFocusWin();
    let [width_center,buffer,width,multimonitor_x_offset] = this.get_width_center(myWin);
    let window_rect = this.window_rect(myWin);
    let x_axis = (width_center - buffer) - window_rect['width'] + multimonitor_x_offset;
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  this.right = function () {
    let myWin = getFocusWin();
    let [width_center,buffer,width,multimonitor_x_offset] = this.get_width_center(myWin);
    let window_rect = this.window_rect(myWin);
    let x_axis = (width_center + buffer) + multimonitor_x_offset;
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  this.up = function () {
    let myWin = getFocusWin();
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = (height_center - buffer) - window_rect['height'] + multimonitor_y_offset;
    // if new window is above the top of the monitor-display, then
    //    ...reset y_axis inside display-monitor
    if (y_axis < 0) {
      y_axis = (buffer*2) + multimonitor_y_offset;
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
  this.down = function () {
    let myWin = getFocusWin();
    let [height_center,buffer,height,multimonitor_y_offset] = this.get_height_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = height_center + buffer + multimonitor_y_offset;

    // if bottom of window falls off the bottom of display-monitor, then
    //    ...reset y_axis so that it is inside display-monitor bourdary
    if ((y_axis+window_rect['height']) > (height+multimonitor_y_offset-buffer)) {
      y_axis = y_axis-((y_axis+window_rect['height'])-height)+multimonitor_y_offset-buffer;
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

    this._tilerToggle = new TilerToggle();

  }

  disable() {
    Main.wm.removeKeybinding("move-window-to-right-workspace");
    Main.wm.removeKeybinding("move-window-to-left-workspace");
    Main.wm.removeKeybinding("empty-workspace-right");
    Main.wm.removeKeybinding("empty-workspace-left");
    Main.wm.removeKeybinding("workspace-right");
    Main.wm.removeKeybinding("workspace-left");
    Main.wm.removeKeybinding("resize-win");
    Main.wm.removeKeybinding("window-right");
    Main.wm.removeKeybinding("window-left");
    Main.wm.removeKeybinding("window-up");
    Main.wm.removeKeybinding("window-down");
    this.rWS = null;
    this.wTiler = null;
    this._settings = null;
  }
}
