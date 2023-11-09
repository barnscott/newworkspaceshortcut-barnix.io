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

        // Preferences Section
        const about = new Adw.PreferencesGroup();
        about.set_title('About')
        page.add(about);

        // Move window to New Workspace
        const githubLink = new Adw.ActionRow({
        title: '<a href="https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr">Github Page</a>',
        subtitle: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr'
        });
        about.add(githubLink);


        // Preferences Section
        const shortcutPrefs = new Adw.PreferencesGroup();
        shortcutPrefs.set_title('Shortcut Preferences')
        page.add(shortcutPrefs);



        // Move window to New Workspace
        const mwr = new Adw.ActionRow({
        title: 'Move window to New Workspace - Right',
        subtitle: 'Ctl + Super + Shift + Right'
        });
        shortcutPrefs.add(mwr);

        const mwl = new Adw.ActionRow({
        title: 'Move window to New Workspace - Left',
        subtitle: 'Ctl + Super + Shift + Left'
        });
        shortcutPrefs.add(mwl);
        


        // New Empty Workspace
        const ewr = new Adw.ActionRow({
        title: 'New Empty Workspace - Right',
        subtitle: 'Ctl + Super + Alt + Right'
        });
        shortcutPrefs.add(ewr);

        const ewl = new Adw.ActionRow({
        title: 'New Empty Workspace - Left',
        subtitle: 'Ctl + Super + Alt + Left'
        });
        shortcutPrefs.add(ewl);



        // Reorder-workspace
        const rwsr = new Adw.ActionRow({
        title: 'Reorder-workspace - Right',
        subtitle: 'Ctl + Super + Right'
        });
        shortcutPrefs.add(rwsr);

        const rwsl = new Adw.ActionRow({
        title: 'Reorder-workspace - Left',
        subtitle: 'Ctl + Super + Left'
        });
        shortcutPrefs.add(rwsl);



        // Options Section
        const optionsPrefs = new Adw.PreferencesGroup();
        optionsPrefs.set_title('Options')
        page.add(optionsPrefs);
        
        // Trigger Overview Switch
        const triggers_overview = new Adw.ActionRow({
        title: 'Reorder-workspace shortcut will trigger Overview'
        });
        optionsPrefs.add(triggers_overview);

        const triggerOverviewSwitch = new Gtk.Switch({
            active: window._settings.get_boolean('move-ws-triggers-overview'),
            valign: Gtk.Align.CENTER,
          });

        triggers_overview.add_suffix(triggerOverviewSwitch);
        triggers_overview.activatable_widget = triggerOverviewSwitch;

        window._settings.bind('move-ws-triggers-overview',
            triggerOverviewSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    }
}

