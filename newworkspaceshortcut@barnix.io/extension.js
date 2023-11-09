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
Promise.reject().catch(logError);

const workspaceManager = Meta.workspaceManager;

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
  let ws = workspaceManager.get_workspace_by_index(newIndex);
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
  let ws = workspaceManager.get_workspace_by_index(newIndex);
  ws.activate(myTime);
}

// FUNCTION, define the workspace # we are moving to
function getNewIndex(m){
  let myIndex = workspaceManager.get_active_workspace_index();
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
    let ws = workspaceManager.get_active_workspace();
    let myIndex = workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex-1) >= 0){
      newIndex = myIndex-1;
      this.moveWS(ws,newIndex,moveWSTriggersOverview);
    }
  }
  this.right = function (moveWSTriggersOverview) {
    let ws = workspaceManager.get_active_workspace();
    let myIndex = workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex+1) <= (workspaceManager.n_workspaces-1)){
      newIndex = myIndex+1;
      this.moveWS(ws,newIndex,moveWSTriggersOverview);
    }
  }
  this.moveWS = function(ws,newIndex,moveWSTriggersOverview){
    if ( !Main.overview.visible && moveWSTriggersOverview ){
      Main.overview.toggle();
    }
    workspaceManager.reorder_workspace(ws, newIndex);
  }
}

export default class myExtension extends Extension {

  enable() {
    this.rWS = new reorderWS();
    let mode = Shell.ActionMode.ALL;
    let flag = Meta.KeyBindingFlags.NONE;
    this._settings = this.getSettings();
    let m,moveWSTriggersOverview;
    
    // Shortcuts for moving a window
    Main.wm.addKeybinding("nwshortcut", this._settings, flag, mode, () => {
      moveWindow(m=1);
    });
    Main.wm.addKeybinding("bwshortcut", this._settings, flag, mode, () => {
      moveWindow(m=0);
    });
    
    // Shortcuts for creating an empty workspace
    Main.wm.addKeybinding("enwshortcut", this._settings, flag, mode, () => {
      emptyWS(m=1);
    });
    Main.wm.addKeybinding("ebwshortcut", this._settings, flag, mode, () => {
      emptyWS(m=0);
    });

    // Shortcuts for moving a workspace
    Main.wm.addKeybinding("workspaceleft", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-ws-triggers-overview');
      this.rWS.left(moveWSTriggersOverview);
    });
    Main.wm.addKeybinding("workspaceright", this._settings, flag, mode, () => {
      moveWSTriggersOverview = this._settings.get_boolean('move-ws-triggers-overview');
      this.rWS.right(moveWSTriggersOverview);
    });
  }

  disable() {
    Main.wm.removeKeybinding("nwshortcut");
    Main.wm.removeKeybinding("bwshortcut");
    Main.wm.removeKeybinding("enwshortcut");
    Main.wm.removeKeybinding("ebwshortcut");
    Main.wm.removeKeybinding("workspaceleft");
    Main.wm.removeKeybinding("workspaceright");
  }
}
