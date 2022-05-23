'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function buildPrefsWidget() {

    let settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.newworkspaceshortcut');

    // Create a parent container widget that is auto-centered
    let prefsWidget = new Gtk.CenterBox({
        visible: true
    });

    // Put contents in a Table-like grid
    let gridWidget = new Gtk.Grid({
        column_spacing: 12,
        row_spacing: 12,
        visible: true
    });
    prefsWidget.set_center_widget(gridWidget);


    let title = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(title, 0, 0, 2, 1);


    let project = new Gtk.Label({
        label: `<a href="https://github.com/barnscott/newworkspaceshortcut-barnix.io#tldr">How to use this extension</a>`,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(project, 0, 1, 2, 1);
    let report = new Gtk.Label({
        label: `<a href="https://github.com/barnscott/newworkspaceshortcut-barnix.io/issues">Report a bug</a>`,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(report, 0, 2, 2, 1);

    
    let space0 = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(space0, 0, 3, 2, 1);


    let mwr = new Gtk.Label({
        label: 'Move-window-to-new-workspace right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(mwr, 0, 4, 1, 1);
    let mwrs = new Gtk.Label({
        label: 'Ctl + Super + Shift + Right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(mwrs, 1, 4, 1, 1);

    let mwl = new Gtk.Label({
        label: 'Move-window-to-new-workspace left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(mwl, 0, 5, 1, 1);
    let mwls = new Gtk.Label({
        label: 'Ctl + Super + Shift + Left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(mwls, 1, 5, 1, 1);


    let space1 = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(space1, 0, 6, 2, 1);


    let ewr = new Gtk.Label({
        label: 'New-empty-workspace right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(ewr, 0, 7, 1, 1);
    let ewrs = new Gtk.Label({
        label: 'Ctl + Super + Alt + Right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(ewrs, 1, 7, 1, 1);


    let ewl = new Gtk.Label({
        label: 'New-empty-workspace left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(ewl, 0, 8, 1, 1);
    let ewls = new Gtk.Label({
        label: 'Ctl + Super + Alt + Left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(ewls, 1, 8, 1, 1);


    let space2 = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(space2, 0, 9, 2, 1);


    let rwsr = new Gtk.Label({
        label: 'Reorder-workspace right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(rwsr, 0, 10, 1, 1);
    let rwsrs = new Gtk.Label({
        label: 'Ctl + Super + Right',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(rwsrs, 1, 10, 1, 1);


    let rwsl = new Gtk.Label({
        label: 'Reorder-workspace left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(rwsl, 0, 11, 1, 1);
    let rwsls = new Gtk.Label({
        label: 'Ctl + Super + Left',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(rwsls, 1, 11, 1, 1);


    // Add toggle to override default
    let toggleLabel = new Gtk.Label({
        label: 'Reorder-workspace shortcut will trigger Overview:',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(toggleLabel, 0, 12, 1, 1);
    let toggle = new Gtk.Switch({
        active: settings.get_boolean ('move-ws-triggers-overview'),
        halign: Gtk.Align.START,
        visible: true
    });
    // Bind toggle to `moveWSTriggersOverview`
    settings.bind(
        'move-ws-triggers-overview',
        toggle,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );
    gridWidget.attach(toggle, 1, 12, 1, 1);



    let space3 = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(space3, 0, 13, 2, 1);

    return prefsWidget;
}