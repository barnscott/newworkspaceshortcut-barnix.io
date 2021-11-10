/* extension.js
 *
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

/* exported init */

const GETTEXT_DOMAIN = 'new-workspace-shortcut';
const ExtensionUtils = imports.misc.extensionUtils;

const {Gio, Shell, Meta} = imports.gi;
const Main = imports.ui.main;

const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const workspaceManager = global.workspace_manager;

// FUNCTION, move the window to the new workspace
function moveWindow() {
  let myIndex = workspaceManager.get_active_workspace_index();
  let newIndex = myIndex + 1;

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

  this.left = function () {
    let ws = workspaceManager.get_active_workspace();
    let myIndex = workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex-1) >= 0){
      newIndex = myIndex-1;
      this.moveWS(ws,newIndex);
    }
  }
  this.right = function () {
    let ws = workspaceManager.get_active_workspace();
    let myIndex = workspaceManager.get_active_workspace_index();
    let newIndex = myIndex;
    if ( (myIndex+1) <= (workspaceManager.n_workspaces-1)){
      newIndex = myIndex+1;
      this.moveWS(ws,newIndex);
    }
  }
  this.moveWS = function(ws,newIndex){
    workspaceManager.reorder_workspace(ws, newIndex);
  }
}

class Extension {
    constructor(uuid,settings_schema) {
        this._uuid = uuid;
        this._settings_schema = settings_schema;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this.rWS = new reorderWS();
        let mode = Shell.ActionMode.ALL;
        let flag = Meta.KeyBindingFlags.NONE;
        let settings = ExtensionUtils.getSettings(this._settings_schema);
      
        Main.wm.addKeybinding("nwshortcut", settings, flag, mode, () => {
          moveWindow();
        });

        Main.wm.addKeybinding("workspaceleft", settings, flag, mode, () => {
          this.rWS.left();
        });
        Main.wm.addKeybinding("workspaceright", settings, flag, mode, () => {
          this.rWS.right();
        });
    }

    disable() {
        Main.wm.removeKeybinding("nwshortcut");
        Main.wm.removeKeybinding("workspaceleft");
        Main.wm.removeKeybinding("workspaceright");
    }
}

function init(meta) {
    return new Extension(meta.uuid,meta.settings_schema);
}