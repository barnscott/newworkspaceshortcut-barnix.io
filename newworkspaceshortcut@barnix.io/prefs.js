'use strict';

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        /////////////////////////////////////////////
        // Move window to New Workspace
        const page_main = new Adw.PreferencesPage();
        page_main.set_icon_name('window-new-symbolic');
        page_main.set_name('Main');
        page_main.set_title('Main');
        window.add(page_main);

        /////////////////////////
        // Group
        const mwGroup = new Adw.PreferencesGroup();
        mwGroup.width_chars = 150;
        mwGroup.set_title('Move window to New Workspace')
        page_main.add(mwGroup);
        
        const mwr = new Adw.ActionRow({
            title: 'Move window to New Workspace - Right',
            subtitle: "Default: Super+Control+Shift+Right"
        });
        mwGroup.add(mwr);
        this.sInit_mwr = new settingsInit();
        this.sInit_mwr.shortcut(window._settings,mwr,"move-window-to-right-workspace");

        const mwl = new Adw.ActionRow({
            title: 'Move window to New Workspace - Left',
            subtitle: 'Default: Super+Control+Shift+Left'
        });
        mwGroup.add(mwl);
        this.sInit_mwl = new settingsInit();
        this.sInit_mwl.shortcut(window._settings,mwl,"move-window-to-left-workspace");
        

        /////////////////////////
        // Next Group
        // New Empty Workspace
        const ewGroup = new Adw.PreferencesGroup();
        ewGroup.set_title('New Empty Workspace')
        page_main.add(ewGroup);
        
        const ewr = new Adw.ActionRow({
            title: 'New Empty Workspace - Right',
            subtitle: 'Default: Control+Shift+Alt+Right'
        });
        ewGroup.add(ewr);
        this.sInit_ewr = new settingsInit();
        this.sInit_ewr.shortcut(window._settings,ewr,"empty-workspace-right");

        const ewl = new Adw.ActionRow({
            title: 'New Empty Workspace - Left',
            subtitle: 'Default: Control+Shift+Alt+Left'
        });
        ewGroup.add(ewl);
        this.sInit_ewl = new settingsInit();
        this.sInit_ewl.shortcut(window._settings,ewl,"empty-workspace-left");


        /////////////////////////
        // Next Group
        // Reorder-workspace
        const rwsGroup = new Adw.PreferencesGroup();
        rwsGroup.set_title('Reorder-workspace')
        page_main.add(rwsGroup);
        
        const rwsr = new Adw.ActionRow({
            title: 'Reorder-workspace - Right',
            subtitle: 'Default: Control+Alt+Right'
        });
        rwsGroup.add(rwsr);
        this.sInit_rwsr = new settingsInit();
        this.sInit_rwsr.shortcut(window._settings,rwsr,"workspace-right");

        const rwsl = new Adw.ActionRow({
            title: 'Reorder-workspace - Left',
            subtitle: 'Default: Control+Alt+Left'
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
        
        /////////////////////////////////////////////
        // WinManager
        const page_winman = new Adw.PreferencesPage();
        page_winman.set_icon_name('focus-top-bar-symbolic');
        page_winman.set_name('Window Manager');
        page_winman.set_title('Window Manager');
        window.add(page_winman);

        /////////////////////////
        // Group
        const winMoveToggleGroup = new Adw.PreferencesGroup();
        winMoveToggleGroup.set_title('Window managment assistant');
        page_winman.add(winMoveToggleGroup);

        const winman_toggle = new Adw.ActionRow({
            title: 'Enable window managment shortcuts'
        });
        winMoveToggleGroup.add(winman_toggle);
        this.sInit_ttoggle = new settingsInit();
        this.sInit_ttoggle.switch(window._settings,winman_toggle,"winman-toggle");

        const win_buffer = new Adw.ActionRow({
            title: 'Window gaps (pixels)',
            subtitle: 'Default: 4'
        });
        winMoveToggleGroup.add(win_buffer);
        this.sInit_win_buffer = new settingsInit();
        this.sInit_win_buffer.number_value(window._settings,win_buffer,"window-buffer");

        /////////////////////////
        // Next Group
        const winMoveInnerGroup = new Adw.PreferencesGroup();
        winMoveInnerGroup.set_title('Move Windows - Inside Axis');
        page_winman.add(winMoveInnerGroup);
        
        const tr = new Adw.ActionRow({
            title: 'Send window right',
            subtitle: 'Default: Control+Super+Right'
        });
        winMoveInnerGroup.add(tr);
        this.sInit_tr = new settingsInit();
        this.sInit_tr.shortcut(window._settings,tr,"window-right");


        const tl = new Adw.ActionRow({
            title: 'Send window left',
            subtitle: 'Default: Control+Super+Left'
        });
        winMoveInnerGroup.add(tl);
        this.sInit_tl = new settingsInit();
        this.sInit_tl.shortcut(window._settings,tl,"window-left");

        const tu = new Adw.ActionRow({
            title: 'Send window up',
            subtitle: 'Default: Control+Super+Up'
        });
        winMoveInnerGroup.add(tu);
        this.sInit_tu = new settingsInit();
        this.sInit_tu.shortcut(window._settings,tu,"window-up");

        const td = new Adw.ActionRow({
            title: 'Send window down',
            subtitle: 'Default: Control+Super+Down'
        });
        winMoveInnerGroup.add(td);
        this.sInit_td = new settingsInit();
        this.sInit_td.shortcut(window._settings,td,"window-down");

        /////////////////////////
        // Next Group
        const winMoveEdgeGroup = new Adw.PreferencesGroup();
        winMoveEdgeGroup.set_title('Move Windows - Outer Display Edge');
        page_winman.add(winMoveEdgeGroup);
        
        const tre = new Adw.ActionRow({
            title: 'Send window right',
            subtitle: 'Default: Control+Super+Right'
        });
        winMoveEdgeGroup.add(tre);
        this.sInit_tr = new settingsInit();
        this.sInit_tr.shortcut(window._settings,tre,"window-right-edge");


        const tle = new Adw.ActionRow({
            title: 'Send window left',
            subtitle: 'Default: Control+Super+Left'
        });
        winMoveEdgeGroup.add(tle);
        this.sInit_tl = new settingsInit();
        this.sInit_tl.shortcut(window._settings,tle,"window-left-edge");

        const tue = new Adw.ActionRow({
            title: 'Send window up',
            subtitle: 'Default: Control+Super+Up'
        });
        winMoveEdgeGroup.add(tue);
        this.sInit_tu = new settingsInit();
        this.sInit_tu.shortcut(window._settings,tue,"window-up-edge");

        const tde = new Adw.ActionRow({
            title: 'Send window down',
            subtitle: 'Default: Control+Super+Down'
        });
        winMoveEdgeGroup.add(tde);
        this.sInit_td = new settingsInit();
        this.sInit_td.shortcut(window._settings,tde,"window-down-edge");
        
        /////////////////////////
        // Next Group
        // Window resize- default group
        const resizeGroup0 = new Adw.PreferencesGroup();
        resizeGroup0.set_title('Primary window-size shortcut');
        page_winman.add(resizeGroup0);

        const resize = new Adw.ActionRow({
            title: 'Resize window',
            subtitle: 'Default: Super+Space'
        });
        resizeGroup0.add(resize);
        this.sInit_resize = new settingsInit();
        this.sInit_resize.shortcut(window._settings,resize,"resize-win");

        const resize_height = new Adw.ActionRow({
            title: 'New window height after resize',
            subtitle: 'Percentage of monitor. Default: 50'
        });
        resizeGroup0.add(resize_height);
        this.sInit_resize_height = new settingsInit();
        this.sInit_resize_height.number_value(window._settings,resize_height,"window-height");

        const resize_width = new Adw.ActionRow({
            title: 'New window width after resize',
            subtitle: 'Percentage of monitor. Default: 35'
        });
        resizeGroup0.add(resize_width);
        this.sInit_resize_width = new settingsInit();
        this.sInit_resize_width.number_value(window._settings,resize_width,"window-width");

        /////////////////////////
        // Next Group
        // Window resize- Alternatives
        const resizeGroup1 = new Adw.PreferencesGroup();
        resizeGroup1.set_title('Alternative #1 window-size shortcut');
        page_winman.add(resizeGroup1);

        const resize1 = new Adw.ActionRow({
            title: 'Resize window',
            subtitle: 'Default: Super+Space'
        });
        resizeGroup1.add(resize1);
        this.sInit_resize1 = new settingsInit();
        this.sInit_resize1.shortcut(window._settings,resize1,"resize-win1");

        const resize_height1 = new Adw.ActionRow({
            title: 'New window height after resize',
            subtitle: 'Percentage of monitor. Default: 50'
        });
        resizeGroup1.add(resize_height1);
        this.sInit_resize_height1 = new settingsInit();
        this.sInit_resize_height1.number_value(window._settings,resize_height1,"window-height1");

        const resize_width1 = new Adw.ActionRow({
            title: 'New window width after resize',
            subtitle: 'Percentage of monitor. Default: 50'
        });
        resizeGroup1.add(resize_width1);
        this.sInit_resize_width1 = new settingsInit();
        this.sInit_resize_width1.number_value(window._settings,resize_width1,"window-width1");

        /////////////////////////
        // Next Group
        // Window resize- Alternative2 group
        const resizeGroup2 = new Adw.PreferencesGroup();
        resizeGroup2.set_title('Alternative #2 window-size shortcut');
        page_winman.add(resizeGroup2);
        
        const resize2 = new Adw.ActionRow({
            title: 'Resize window',
            subtitle: 'Default: Super+Space'
        });
        resizeGroup2.add(resize2);
        this.sInit_resize2 = new settingsInit();
        this.sInit_resize2.shortcut(window._settings,resize2,"resize-win2");

        const resize_height2 = new Adw.ActionRow({
            title: 'New window height after resize',
            subtitle: 'Percentage of monitor. Default: 50'
        });
        resizeGroup2.add(resize_height2);
        this.sInit_resize_height2 = new settingsInit();
        this.sInit_resize_height2.number_value(window._settings,resize_height2,"window-height2");

        const resize_width2 = new Adw.ActionRow({
            title: 'New window width after resize',
            subtitle: 'Percentage of monitor. Default: 15'
        });
        resizeGroup2.add(resize_width2);
        this.sInit_resize_width2 = new settingsInit();
        this.sInit_resize_width2.number_value(window._settings,resize_width2,"window-width2");

        /////////////////////////
        // Next Group
        // Window resize- Alternative3 group
        const resizeGroup3 = new Adw.PreferencesGroup();
        resizeGroup3.set_title('Alternative #3 window-size shortcut');
        page_winman.add(resizeGroup3);

        const resize3 = new Adw.ActionRow({
            title: 'Resize window',
            subtitle: 'Default: Super+Space'
        });
        resizeGroup3.add(resize3);
        this.sInit_resize3 = new settingsInit();
        this.sInit_resize3.shortcut(window._settings,resize3,"resize-win3");

        const resize_height3 = new Adw.ActionRow({
            title: 'New window height after resize',
            subtitle: 'Percentage of monitor. Default: 30'
        });
        resizeGroup3.add(resize_height3);
        this.sInit_resize_height3 = new settingsInit();
        this.sInit_resize_height3.number_value(window._settings,resize_height3,"window-height3");

        const resize_width3 = new Adw.ActionRow({
            title: 'New window width after resize',
            subtitle: 'Percentage of monitor. Default: 25'
        });
        resizeGroup3.add(resize_width3);
        this.sInit_resize_width3 = new settingsInit();
        this.sInit_resize_width3.number_value(window._settings,resize_width3,"window-width3");

        /////////////////////////////////////////////
        // About
        const page_about = new Adw.PreferencesPage();
        page_about.set_icon_name('bookmark-new-symbolic');
        page_about.set_name('About');
        page_about.set_title('About');
        window.add(page_about);

        const aboutGroup = new Adw.PreferencesGroup();
        aboutGroup.set_title('About');
        page_about.add(aboutGroup);

        // Move window to New Workspace
        const githubLink = new Adw.ActionRow({
            subtitle: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr'
        });
        const buttonlink = new Gtk.LinkButton({
            label: 'Project Home Page',
            uri: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr'
        });

        aboutGroup.add(githubLink);
        githubLink.add_prefix(buttonlink)
        githubLink.activatable_widget = buttonlink;
    }
}

class settingsInit {

    shortcut (ext_settings,actionEvent,sEvent) {
        const shortcutEntry = new Gtk.Text({
            buffer:  new Gtk.EntryBuffer({
                text: String(ext_settings.get_strv(sEvent))
            }),
            max_length: 100,
            placeholder_text: String(ext_settings.get_strv(sEvent)),
            propagate_text_width: true
        });

        shortcutEntry.connect('activate', () => {
            let newshortcutarray = [ String(shortcutEntry.get_buffer().text) ]
            ext_settings.set_strv(sEvent,newshortcutarray)
        });
        const button = new Gtk.Button({ label: 'OK' });
        button.connect('clicked', () => {
            let newshortcutarray = [ String(shortcutEntry.get_buffer().text) ]
            ext_settings.set_strv(sEvent,newshortcutarray)
        });

        actionEvent.add_suffix(shortcutEntry);
        actionEvent.add_suffix(button);
        actionEvent.activatable_widget = shortcutEntry;
    }

    number_value (ext_settings,actionEvent,sEvent) {
        const integerEntry = new Gtk.Text({
            buffer:  new Gtk.EntryBuffer({
                text: String(ext_settings.get_int(sEvent))
            })
        });

        integerEntry.connect('activate', () => {
            let newNumberValue = Number(integerEntry.get_buffer().text)
            ext_settings.set_int(sEvent,newNumberValue)
        });
        const button = new Gtk.Button({ label: 'OK' });
        button.connect('clicked', () => {
            let newNumberValue = Number(integerEntry.get_buffer().text)
            ext_settings.set_int(sEvent,newNumberValue)
        });

        actionEvent.add_suffix(integerEntry);
        actionEvent.add_suffix(button);
        actionEvent.activatable_widget = integerEntry;
    }

    switch (ext_settings,actionEvent,sEvent) {
        const winmanToggleSwitch = new Gtk.Switch({
            active: ext_settings.get_boolean(sEvent),
            valign: Gtk.Align.CENTER,
            });
        
        ext_settings.bind(sEvent,winmanToggleSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        actionEvent.add_suffix(winmanToggleSwitch);
        actionEvent.activatable_widget = winmanToggleSwitch;
    }
  }