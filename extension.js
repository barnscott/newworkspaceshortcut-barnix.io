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
//const Shell = imports.gi.Shell;
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
  const newIndex = workspaceManager.get_active_workspace_index() + 1;
  log(newIndex);
  //const mywin = global.window_manager.get_default();
  const mywin = Shell.WindowTracker.get_default();

  Main.wm.insertWorkspace(newIndex);
  Meta.Window.change_workspace_by_index(newIndex, false);
  
  // Shell.wm.moveWindow
  //Main.wm.change_workspace_by_index(newIndex, false);
  //const newWS = workspaceManager.get_workspace_by_index(newIndex);
  //const myWindow = Meta.display.get_focus_window();
  //const myWindow = Shell.WindowTracker.get_default();
  //log(objToString(myWindow))
  //log(JSON.stringify(window))
  //Main.wm.actionMoveWindow(newWS, window); //swapped from window
  //window.change_workspace_by_index(newIndex, false);
  //mywin.moveWindow(newIndex)
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