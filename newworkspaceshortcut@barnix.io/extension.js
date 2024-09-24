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
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as WinMan from './extension/winman.js';

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
export function getFocusWin(){

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

class winManToggle {
    constructor(extSettings,flag,mode) {
      this._settings = extSettings;
      this.flag = flag;
      this.mode = mode;
      this.toggle_event();
    }

    toggle_event () {
      var winman_status_key = this._settings.get_boolean('winman-toggle');
      if(winman_status_key == true ){
          this.enable();
      }else{
          this.disable();
      }
    }

    enable () {
      // Enabling this extension should disable the following native Gnome shortcuts
      let keybinding_schema_settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.wm.keybindings' });
      keybinding_schema_settings.set_strv('move-to-side-e', []);
      keybinding_schema_settings.set_strv('move-to-side-n', []);
      keybinding_schema_settings.set_strv('move-to-side-s', []);
      keybinding_schema_settings.set_strv('move-to-side-w', []);

      this.winManEvent = new WinMan.windowManager(this._settings);
      Main.wm.addKeybinding("resize-win", this._settings, this.flag, this.mode, () => {
        this.winManEvent.resize_window('window-height','window-width');
      });
      Main.wm.addKeybinding("resize-win1", this._settings, this.flag, this.mode, () => {
        this.winManEvent.resize_window('window-height1','window-width1');
      });
      Main.wm.addKeybinding("resize-win2", this._settings, this.flag, this.mode, () => { 
        this.winManEvent.resize_window('window-height2','window-width2');
      });
      Main.wm.addKeybinding("resize-win3", this._settings, this.flag, this.mode, () => {
        this.winManEvent.resize_window('window-height3','window-width3');
      });
      // Inner window relocations:
      Main.wm.addKeybinding("window-right", this._settings, this.flag, this.mode, () => {
        this.winManEvent.right();
      });
      Main.wm.addKeybinding("window-left", this._settings, this.flag, this.mode, () => {
        this.winManEvent.left();
      });
      Main.wm.addKeybinding("window-up", this._settings, this.flag, this.mode, () => {
        this.winManEvent.up();
      });
      Main.wm.addKeybinding("window-down", this._settings, this.flag, this.mode, () => {
        this.winManEvent.down();
      });
      // Display-edge window relocations:
      Main.wm.addKeybinding("window-right-edge", this._settings, this.flag, this.mode, () => {
        this.winManEvent.right_edge();
      });
      Main.wm.addKeybinding("window-left-edge", this._settings, this.flag, this.mode, () => {
        this.winManEvent.left_edge();
      });
      Main.wm.addKeybinding("window-up-edge", this._settings, this.flag, this.mode, () => {
        this.winManEvent.up_edge();
      });
      Main.wm.addKeybinding("window-down-edge", this._settings, this.flag, this.mode, () => {
        this.winManEvent.down_edge();
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
      Main.wm.removeKeybinding("window-right-edge");
      Main.wm.removeKeybinding("window-left-edge");
      Main.wm.removeKeybinding("window-up-edge");
      Main.wm.removeKeybinding("window-down-edge");
      this.winManEvent = null;
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

    this._winManToggle = new winManToggle(this._settings,flag,mode);
    this._settings.connect(`changed::winman-toggle`,() => {
      this._winManToggle.toggle_event();
    });

  }

  disable() {
    Main.wm.removeKeybinding("move-window-to-right-workspace");
    Main.wm.removeKeybinding("move-window-to-left-workspace");
    Main.wm.removeKeybinding("empty-workspace-right");
    Main.wm.removeKeybinding("empty-workspace-left");
    Main.wm.removeKeybinding("workspace-right");
    Main.wm.removeKeybinding("workspace-left");
    this._winManToggle.disable();
    this.rWS = null;
    this._winManToggle = null;
    this._settings = null;
  }
}
