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
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as WinMan from './extension/winman.js';
import { getFocusWin } from './extension/utils.js';
import { highlightFocus } from './extension/highlight.js';
import { focusChanger } from './extension/focus.js';

// FUNCTION, move the window to the new workspace
function moveWindow(m, settings) {
  //0. Define the WS index I want to move to
  let newIndex = getNewIndex(m);

  //1. get the Focused / active  window
  let myWin = getFocusWin();
  if (!myWin) return;

  //2. create  new  workspace
  Main.wm.insertWorkspace(newIndex);

  //3. stick the focused/active window (the same as Always on Visible Workspace), so it can move to the new workspace and stay always visible on the screen when GNOME Shell plays workspace switch animation
  myWin.stick();

  //4. move me to new workspace
  let myTime = global.get_current_time();
  let ws = global.workspaceManager.get_workspace_by_index(newIndex);
  ws.activate_with_focus(myWin, myTime);

  //5. leave the just moved window in the new workspace
  myWin.unstick();

  //6. optionally maximize the window on arrival
  if (settings.get_boolean('move-window-maximize'))
    myWin.maximize();
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

// Direction constants for workspace insertion: LEFT=0 inserts at myIndex, RIGHT=1 inserts at myIndex+1
const Direction = Object.freeze({ LEFT: 0, RIGHT: 1 });

// FUNCTION, define the workspace # we are moving to
function getNewIndex(direction) {
  return global.workspaceManager.get_active_workspace_index() + direction;
}

function reorderWorkspace(direction, moveWSTriggersOverview) {
  const wm = global.workspaceManager;
  const myIndex = wm.get_active_workspace_index();
  const newIndex = myIndex + direction;
  const inBounds = direction < 0 ? newIndex >= 0 : newIndex <= wm.n_workspaces - 1;
  if (!inBounds) return;
  if (!Main.overview.visible && moveWSTriggersOverview)
    Main.overview.toggle();
  wm.reorder_workspace(wm.get_active_workspace(), newIndex);
}

class winManToggle {
    constructor(extSettings,flag,mode) {
      this._settings = extSettings;
      this.flag = flag;
      this.mode = mode;
      this.toggle_event();
    }

    toggle_event () {
      if (this._settings.get_boolean('winman-toggle'))
        this.enable();
      else
        this.disable();
    }

    enable () {
      // Enabling this extension should disable the following native Gnome shortcuts,
      // saving current values so they can be restored in disable().
      this._keybindingSettings = new Gio.Settings({ schema_id: 'org.gnome.desktop.wm.keybindings' });
      this._savedNativeKeybindings = {};
      for (const key of ['move-to-side-e', 'move-to-side-n', 'move-to-side-s', 'move-to-side-w']) {
        this._savedNativeKeybindings[key] = this._keybindingSettings.get_strv(key);
        this._keybindingSettings.set_strv(key, []);
      }

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
      if (this._savedNativeKeybindings) {
        for (const [key, value] of Object.entries(this._savedNativeKeybindings)) {
          this._keybindingSettings.set_strv(key, value);
        }
        this._savedNativeKeybindings = null;
        this._keybindingSettings = null;
      }
    }
  }

export default class newWorkspaceShortcuts extends Extension {

  enable() {
    let mode = Shell.ActionMode.ALL;
    let flag = Meta.KeyBindingFlags.NONE;
    this._settings = this.getSettings();

    // Shortcuts for moving a window
    Main.wm.addKeybinding("move-window-to-right-workspace", this._settings, flag, mode, () => {
      moveWindow(Direction.RIGHT, this._settings);
    });
    Main.wm.addKeybinding("move-window-to-left-workspace", this._settings, flag, mode, () => {
      moveWindow(Direction.LEFT, this._settings);
    });

    // Shortcuts for creating an empty workspace
    Main.wm.addKeybinding("empty-workspace-right", this._settings, flag, mode, () => {
      emptyWS(Direction.RIGHT);
    });
    Main.wm.addKeybinding("empty-workspace-left", this._settings, flag, mode, () => {
      emptyWS(Direction.LEFT);
    });

    // Shortcuts for moving a workspace
    Main.wm.addKeybinding("workspace-right", this._settings, flag, mode, () => {
      reorderWorkspace(1, this._settings.get_boolean('move-workspace-triggers-overview'));
    });
    Main.wm.addKeybinding("workspace-left", this._settings, flag, mode, () => {
      reorderWorkspace(-1, this._settings.get_boolean('move-workspace-triggers-overview'));
    });

    this._winManToggle = new winManToggle(this._settings,flag,mode);
    this._winmanToggleHandlerId = this._settings.connect('changed::winman-toggle', () => {
      this._winManToggle.toggle_event();
    });

    this._highlight = new highlightFocus(this._settings);
    if (this._settings.get_boolean('highlight-toggle'))
      this._highlight.enable();
    this._highlightToggleHandlerId = this._settings.connect('changed::highlight-toggle', () => {
      if (this._settings.get_boolean('highlight-toggle'))
        this._highlight.enable();
      else
        this._highlight.disable();
    });

    this._focusChanger = new focusChanger(this._settings);
    if (this._settings.get_boolean('focus-changer-toggle'))
      this._focusChanger.enable();
    this._focusChangerToggleHandlerId = this._settings.connect('changed::focus-changer-toggle', () => {
      if (this._settings.get_boolean('focus-changer-toggle'))
        this._focusChanger.enable();
      else
        this._focusChanger.disable();
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
    this._winManToggle = null;
    if (this._winmanToggleHandlerId) {
      this._settings.disconnect(this._winmanToggleHandlerId);
      this._winmanToggleHandlerId = null;
    }
    this._highlight.disable();
    this._highlight = null;
    if (this._highlightToggleHandlerId) {
      this._settings.disconnect(this._highlightToggleHandlerId);
      this._highlightToggleHandlerId = null;
    }
    this._focusChanger.disable();
    this._focusChanger = null;
    if (this._focusChangerToggleHandlerId) {
      this._settings.disconnect(this._focusChangerToggleHandlerId);
      this._focusChangerToggleHandlerId = null;
    }
    this._settings = null;
  }
}
