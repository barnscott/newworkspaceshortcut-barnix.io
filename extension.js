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

// const { GObject, St } = imports.gi;
const {Gio, Shell, Meta} = imports.gi;
const Main = imports.ui.main;
// const GObject = imports.gi.GObject;
// const Shell = imports.gi.Shell;
// const Meta = imports.gi.Meta;
// const St = imports.gi.St;
// const Clutter = imports.gi.Clutter;
// const Gio = imports.gi.Gio;
// const Workspace = imports.ui.workspace;

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

// FUNCTION,  
function moveWindow() {
  log('LOGGER:shortcut action...');
  const workspaceManager = global.workspace_manager;
  let myIndex = workspaceManager.get_active_workspace_index();
  let newIndex = myIndex + 1;
  log(myIndex);
  log(newIndex);

  //1) get the Focused / active  window
  let myWin = getFocusWin();

  //2) create  new  workspace
  Main.wm.insertWorkspace(newIndex);

  //3) on the Focused Meta.Window object, call change_workspace_by_index(space_index, append)
  myWin.change_workspace_by_index(newIndex, false);

}

function getFocusWin(){
  // let myWin = global.get_window_actors()[0].get_meta_window();
  // log(myWin.title); 

  let myWins = global.get_window_actors();
  let focusWin = myWins.forEach(findFocus);
  log("DEBUG, win was returned---"+ focusWin.title );

  return focusWin;

}

function findFocus(item) {
  let win = item.get_meta_window();
  let focstat = win.has_focus();

  if ( focstat ){
    log("DEBUG, focus:"+ focstat +"---"+ win.title  );
    return win;
  }
}

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        log('LOGGER:newworkspaceshortcut is enabled.');
        let mode = Shell.ActionMode.ALL;
        let flag = Meta.KeyBindingFlags.NONE;
        let settings = getSettings();
      
        Main.wm.addKeybinding("nwshortcut", settings, flag, mode, () => {
          moveWindow();
        });
    }

    disable() {
        Main.wm.removeKeybinding("nwshortcut");
        log('LOGGER: newworkspaceshortcut is disabled.');
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}