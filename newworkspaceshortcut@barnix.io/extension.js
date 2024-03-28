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

// Super space :: resize window’s height and width to 40% of Display height
// Ctl super down :: move window to Bottom of Vertical Center, with 2% buffer
// Ctl super right :: move window to Right of Horizontal Center, with 2% buffer
function tiler(){

  // Display constructor
  this.get_display_info = function (myWin){
    let mydisplay = myWin.get_display();
    let mydisplaysize = mydisplay.get_size();
    // returns width,height
    return mydisplaysize
  }
  this.get_vertical_center = function (myWin){
    let display_vertical = this.get_display_info(myWin)[1]
    let center = (display_vertical / 2)
    let buffer = display_vertical * 0.02
    return [center,buffer,display_vertical]
  }
  this.get_horizontal_center = function (myWin){
    let display_hor = this.get_display_info(myWin)[0]
    let center = (display_hor / 2)
    let buffer = display_hor * 0.02
    return [center,buffer]
  }

  // Window constructor
  this.window_rect = function (myWin) {
    let rect = myWin.get_frame_rect();

    // rect is an object that contains: x,y,width,height
    return rect
  }

  this.resize_window = function () {
    // get the Focused / active  window
    let myWin = getFocusWin();
  
    // determine 40% of display height
    let displayreponse = this.get_display_info(myWin);
    let newWindowSize = displayreponse[1] * 0.4;
    console.log("newwindowsize--",newWindowSize);
  
    // modify window size
    myWin.move_resize_frame(true, 0, 0, newWindowSize, newWindowSize);
  }

  // // Window Relocation functions
  this.left = function () {
    let myWin = getFocusWin();
    console.log("this.left--");
    let horizontal_spec = this.get_horizontal_center(myWin);
    let window_rect = this.window_rect(myWin);
    let x_axis = (horizontal_spec[0] - horizontal_spec[1]) - window_rect['width'];
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  this.right = function () {
    let myWin = getFocusWin();
    let horizontal_spec = this.get_horizontal_center(myWin);
    let window_rect = this.window_rect(myWin);
    let x_axis = (horizontal_spec[0] + horizontal_spec[1]);
    myWin.move_frame(true, x_axis, window_rect['y']);
  }
  this.up = function () {
    let myWin = getFocusWin();
    let vertical_spec = this.get_vertical_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = (vertical_spec[0] - vertical_spec[1]) - window_rect['height'];
    console.log("y_axis--",y_axis);
    // If window is moved off display, then reset to the buffer distance
    if (y_axis < 0) {
      y_axis = vertical_spec[1];
      console.log("fix y_axis--",y_axis);
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
  this.down = function () {
    let myWin = getFocusWin();
    let vertical_spec = this.get_vertical_center(myWin);
    let window_rect = this.window_rect(myWin);
    let y_axis = vertical_spec[0] + vertical_spec[1];
    console.log("y_axis--",y_axis);
    // if bottom of window is off display, reset window back into display
    if (y_axis+window_rect['height'] > vertical_spec[2]) {
      y_axis = y_axis-((y_axis+window_rect['height'])-vertical_spec[2])
      console.log("fix y_axis--",y_axis);
    }
    myWin.move_frame(true,window_rect['x'],y_axis);
  }
}
// END ///////////////////////////////////////

export default class newWorkspaceShortcuts extends Extension {

  enable() {
    this.rWS = new reorderWS();
    this.wTiler = new tiler();
    let mode = Shell.ActionMode.ALL;
    let flag = Meta.KeyBindingFlags.NONE;
    this._settings = this.getSettings();
    let m,moveWSTriggersOverview;
    
    // Shortcuts for moving a window
    Main.wm.addKeybinding("movewinright", this._settings, flag, mode, () => {
      moveWindow(m=1);
    });
    Main.wm.addKeybinding("movewinleft", this._settings, flag, mode, () => {
      moveWindow(m=0);
    });
    
    // Shortcuts for creating an empty workspace
    Main.wm.addKeybinding("emptywsright", this._settings, flag, mode, () => {
      emptyWS(m=1);
    });
    Main.wm.addKeybinding("emptywsleft", this._settings, flag, mode, () => {
      emptyWS(m=0);
    });

    // Shortcuts for moving a workspace
    Main.wm.addKeybinding("wsright", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-ws-triggers-overview');
      this.rWS.right(moveWSTriggersOverview);
    });
    Main.wm.addKeybinding("wsleft", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-ws-triggers-overview');
      this.rWS.left(moveWSTriggersOverview);
    });

    // Shortcuts for resizing window
    Main.wm.addKeybinding("resizewin", this._settings, flag, mode, () => {
      this.wTiler.resize_window();
    });

    // Shortcuts for sliding window
    Main.wm.addKeybinding("winright", this._settings, flag, mode, () => {
      this.wTiler.right();
    });
    Main.wm.addKeybinding("winleft", this._settings, flag, mode, () => {
      this.wTiler.left();
    });
    Main.wm.addKeybinding("winup", this._settings, flag, mode, () => {
      this.wTiler.up();
    });
    Main.wm.addKeybinding("windown", this._settings, flag, mode, () => {
      this.wTiler.down();
    });
  }

  disable() {
    Main.wm.removeKeybinding("movewinright");
    Main.wm.removeKeybinding("movewinleft");
    Main.wm.removeKeybinding("emptywsright");
    Main.wm.removeKeybinding("emptywsleft");
    Main.wm.removeKeybinding("wsright");
    Main.wm.removeKeybinding("wsleft");
    Main.wm.removeKeybinding("resizewin");
    Main.wm.removeKeybinding("winright");
    Main.wm.removeKeybinding("winleft");
    Main.wm.removeKeybinding("winup");
    Main.wm.removeKeybinding("windown");
    this.rWS = null;
    this.wTiler = null;
    this._settings = null;
  }
}
