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
// const Meta = imports.gi.Meta;

const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;

// FUNCTION, GET SCHEMA
function getSettings () {
  let GioSSS = Gio.SettingsSchemaSource;
  let schemaSource = GioSSS.new_from_directory(
    Me.dir.get_child("schemas").get_path(),
    GioSSS.get_default(),
    false
  );
  let schemaObj = schemaSource.lookup(
    'org.gnome.shell.extensions.newworkspaceshortcut', true);
  if (!schemaObj) {
    throw new Error('cannot find schemas');
  }
  return new Gio.Settings({ settings_schema : schemaObj });
}

// function reorderWS() {
  //https://gjs-docs.gnome.org/meta8~8_api/meta.workspacemanager#method-reorder_workspace
// }

// FUNCTION, move the window to the new workspace
function moveWindow() {
  log('NewWorkspaceShortcutLogger:shortcut action...');
  const workspaceManager = global.workspace_manager;
  let myIndex = workspaceManager.get_active_workspace_index();
  let newIndex = myIndex + 1;

  //1. get the Focused / active  window
  let myWin = getFocusWin();

  //2. create  new  workspace
  Main.wm.insertWorkspace(newIndex);

  //3. on the Focused Meta.Window object
  myWin.change_workspace_by_index(newIndex, false);

  //4. move me to new workspace
  //Meta.Workspace  global.workspace.activate_with_focus(myWin); 
  let myTime = global.get_current_time();
  let ws = workspaceManager.get_workspace_by_index(newIndex);
  ws.activate_with_focus(myWin, myTime);
}

function getFocusWin(){

  let myWins = global.get_window_actors();
  let focusWin;
  myWins.forEach((winCont) => {
    let win = winCont.get_meta_window();
    let focstat = win.has_focus();
    if ( focstat ){
      log("NewWorkspaceShortcutLogger: focus:"+ win.title  );
      focusWin = win;
    }
  });
  return focusWin;
}

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        log('NewWorkspaceShortcutLogger:newworkspaceshortcut is enabled.');
        let mode = Shell.ActionMode.ALL;
        let flag = Meta.KeyBindingFlags.NONE;
        let settings = getSettings();
      
        Main.wm.addKeybinding("nwshortcut", settings, flag, mode, () => {
          moveWindow();
        });
    }

    disable() {
        Main.wm.removeKeybinding("nwshortcut");
        log('NewWorkspaceShortcutLogger: newworkspaceshortcut is disabled.');
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}