'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();


function init() {
}

function buildPrefsWidget() {

    this.settings = ExtensionUtils.getSettings(
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

    let titlespace = new Gtk.Label({
        label: ` `,
        halign: Gtk.Align.CENTER,
        use_markup: true,
        visible: true
    });
    gridWidget.attach(titlespace, 0, 0, 2, 1);

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

    // Add toggle to override default
    let toggleLabel = new Gtk.Label({
        label: 'Reorder-workspace shortcut will trigger Overview:',
        halign: Gtk.Align.START,
        visible: true
    });
    gridWidget.attach(toggleLabel, 0, 3, 1, 1);

    let toggle = new Gtk.Switch({
        active: this.settings.get_boolean ('move-ws-triggers-overview'),
        halign: Gtk.Align.END,
        visible: true
    });
    gridWidget.attach(toggle, 1, 3, 1, 1);

    // Bind toggle to `moveWSTriggersOverview`
    this.settings.bind(
        'move-ws-triggers-overview',
        toggle,
        'active',
        Gio.SettingsBindFlags.DEFAULT
    );

    return prefsWidget;
}