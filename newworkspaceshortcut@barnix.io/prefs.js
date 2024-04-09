'use strict';

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const page = new Adw.PreferencesPage();

        const group = new Adw.PreferencesGroup({
            title: _('New Workspace Shortcut'),
        });
        page.add(group);

        window.add(page);

        // About Section
        const about = new Adw.PreferencesGroup();
        about.set_title('About')
        page.add(about);

        // Move window to New Workspace
        const githubLink = new Adw.ActionRow({
        title: '<a href="https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr">Github Page</a>',
        subtitle: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr'
        });
        about.add(githubLink);



        // Move window to New Workspace
        const mwGroup = new Adw.PreferencesGroup();
        mwGroup.set_title('Move window to New Workspace')
        page.add(mwGroup);
        
        const mwr = new Adw.ActionRow({
        title: 'Move window to New Workspace - Right',
        subtitle: 'Default: Ctl + Super + Shift + Right'
        });
        mwGroup.add(mwr);
        this.sInit_mwr = new settingsInit();
        this.sInit_mwr.shortcut(window._settings,mwr,"move-window-to-right-workspace");

        const mwl = new Adw.ActionRow({
        title: 'Move window to New Workspace - Left',
        subtitle: 'Default: Ctl + Super + Shift + Left'
        });
        mwGroup.add(mwl);
        this.sInit_mwl = new settingsInit();
        this.sInit_mwl.shortcut(window._settings,mwl,"move-window-to-left-workspace");
        


        // New Empty Workspace
        const ewGroup = new Adw.PreferencesGroup();
        ewGroup.set_title('New Empty Workspace')
        page.add(ewGroup);
        
        const ewr = new Adw.ActionRow({
        title: 'New Empty Workspace - Right',
        subtitle: 'Default: Ctl + Shift + Alt + Right'
        });
        ewGroup.add(ewr);
        this.sInit_ewr = new settingsInit();
        this.sInit_ewr.shortcut(window._settings,ewr,"empty-workspace-right");

        const ewl = new Adw.ActionRow({
        title: 'New Empty Workspace - Left',
        subtitle: 'Default: Ctl + Shift + Alt + Left'
        });
        ewGroup.add(ewl);
        this.sInit_ewl = new settingsInit();
        this.sInit_ewl.shortcut(window._settings,ewl,"empty-workspace-left");



        // Reorder-workspace
        const rwsGroup = new Adw.PreferencesGroup();
        rwsGroup.set_title('Reorder-workspace')
        page.add(rwsGroup);
        
        const rwsr = new Adw.ActionRow({
        title: 'Reorder-workspace - Right',
        subtitle: 'Default: Ctl + Alt + Right'
        });
        rwsGroup.add(rwsr);
        this.sInit_rwsr = new settingsInit();
        this.sInit_rwsr.shortcut(window._settings,rwsr,"workspace-right");

        const rwsl = new Adw.ActionRow({
        title: 'Reorder-workspace - Left',
        subtitle: 'Default: Ctl + Alt + Left'
        });
        rwsGroup.add(rwsl);
        this.sInit_rwsl = new settingsInit();
        this.sInit_rwsl.shortcut(window._settings,rwsl,"workspace-left");

        const triggers_overview = new Adw.ActionRow({
        title: 'Reorder-workspace shortcut will trigger Overview'
        });
        rwsGroup.add(triggers_overview);
        this.sInit_toverview = new settingsInit();
        this.sInit_toverview.switch(window._settings,triggers_overview,"move-workspace-triggers-overview");
        


        // Tiler
        const tilerGroup = new Adw.PreferencesGroup();
        tilerGroup.set_title('Window managment assistant for tiling')
        page.add(tilerGroup);

        const tiler_toggle = new Adw.ActionRow({
            title: 'Enable window managment shortcuts'
        });
        tilerGroup.add(tiler_toggle);
        this.sInit_ttoggle = new settingsInit();
        this.sInit_ttoggle.switch(window._settings,tiler_toggle,"tiler-toggle");
        

        const tr = new Adw.ActionRow({
        title: 'Send window right',
        subtitle: 'Default: Ctl + Super + Left'
        });
        tilerGroup.add(tr);
        this.sInit_tr = new settingsInit();
        this.sInit_tr.shortcut(window._settings,tr,"window-right");


        const tl = new Adw.ActionRow({
        title: 'Send window left',
        subtitle: 'Default: Ctl + Super + Left'
        });
        tilerGroup.add(tl);
        this.sInit_tl = new settingsInit();
        this.sInit_tl.shortcut(window._settings,tl,"window-left");

        const tu = new Adw.ActionRow({
        title: 'Send window up',
        subtitle: 'Default: Ctl + Super + Up'
        });
        tilerGroup.add(tu);
        this.sInit_tu = new settingsInit();
        this.sInit_tu.shortcut(window._settings,tu,"window-up");

        const td = new Adw.ActionRow({
        title: 'Send window down',
        subtitle: 'Default: Ctl + Super + Down'
        });
        tilerGroup.add(td);
        this.sInit_td = new settingsInit();
        this.sInit_td.shortcut(window._settings,td,"window-down");
        
        const resize = new Adw.ActionRow({
        title: 'Resize window',
        subtitle: 'Default: Super + Space'
        });
        tilerGroup.add(resize);
        this.sInit_resize = new settingsInit();
        this.sInit_resize.shortcut(window._settings,resize,"resize-win");

        const resize_height = new Adw.ActionRow({
        title: 'New window height after resize, as percentage of monitor',
        subtitle: 'Default: 45'
        });
        tilerGroup.add(resize_height);
        this.sInit_resize_height = new settingsInit();
        this.sInit_resize_height.number_value(window._settings,resize_height,"window-height");

        const resize_width = new Adw.ActionRow({
        title: 'New window width after resize, as percentage of monitor',
        subtitle: 'Default: 40'
        });
        tilerGroup.add(resize_width);
        this.sInit_resize_width = new settingsInit();
        this.sInit_resize_width.number_value(window._settings,resize_width,"window-width");

    }
}

function settingsInit() {

    this.shortcut = function (ext_settings,actionEvent,sEvent) {
        const shortcutEntry = new Gtk.Text({
            buffer:  new Gtk.EntryBuffer({
                text: String(ext_settings.get_strv(sEvent))
            })
        });

        shortcutEntry.connect('activate', () => {
            let newshortcutarray = [ String(shortcutEntry.get_buffer().text) ]
            ext_settings.set_strv(sEvent,newshortcutarray)
        });
        actionEvent.add_suffix(shortcutEntry);
        actionEvent.activatable_widget = shortcutEntry;
    }

    this.number_value = function (ext_settings,actionEvent,sEvent) {
        const integerEntry = new Gtk.Text({
            buffer:  new Gtk.EntryBuffer({
                text: String(ext_settings.get_int(sEvent))
            })
        });

        integerEntry.connect('activate', () => {
            let newNumberValue = [ String(integerEntry.get_buffer().text) ]
            ext_settings.set_strv(sEvent,newNumberValue)
        });
        actionEvent.add_suffix(integerEntry);
        actionEvent.activatable_widget = integerEntry;
    }

    this.switch = function (ext_settings,actionEvent,sEvent) {
        const tilerToggleSwitch = new Gtk.Switch({
            active: ext_settings.get_boolean(sEvent),
            valign: Gtk.Align.CENTER,
            });
        
        ext_settings.bind(sEvent,tilerToggleSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        actionEvent.add_suffix(tilerToggleSwitch);
        actionEvent.activatable_widget = tilerToggleSwitch;
    }
  }