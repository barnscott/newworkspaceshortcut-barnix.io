import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

// Keyboard capture helpers (pattern from the focus-changer extension).

const FORBIDDEN_KEYVALS = [
  Gdk.KEY_Home, Gdk.KEY_Page_Up, Gdk.KEY_Page_Down, Gdk.KEY_End,
  Gdk.KEY_Tab, Gdk.KEY_KP_Enter, Gdk.KEY_Return, Gdk.KEY_Mode_switch, Gdk.KEY_Space,
];

function isValidAccel(mask, keyval) {
  return Gtk.accelerator_valid(keyval, mask) || (keyval === Gdk.KEY_Tab && mask !== 0);
}

function isValidBinding(mask, keycode, keyval) {
  return (
    mask !== 0 &&
    keycode !== 0 &&
    (mask & ~Gdk.ModifierType.SHIFT_MASK) !== 0 &&
    !FORBIDDEN_KEYVALS.includes(keyval)
  );
}

// Row builder helpers.

function makePage(window, title, icon) {
  const page = new Adw.PreferencesPage({ name: title, title, icon_name: icon });
  window.add(page);
  return page;
}

function makeGroup(page, title) {
  const group = new Adw.PreferencesGroup({ title });
  page.add(group);
  return group;
}

// Returns a normalised accelerator string Gtk.ShortcutLabel can render,
// or '' (which triggers disabled_text) if the value is unrecognised.
function _normaliseAccel(accel) {
  if (!accel) return '';
  const [ok] = Gtk.accelerator_parse(accel);
  return ok ? accel : '';
}

// Shortcut row: clicking opens a modal capture dialog.
// Displays the current accelerator via Gtk.ShortcutLabel.
function addShortcutRow(settings, group, title, subtitle, key) {
  const row = new Adw.ActionRow({ title, subtitle });
  group.add(row);

  const label = new Gtk.ShortcutLabel({
    disabled_text: 'Click to set shortcut',
    accelerator: _normaliseAccel(settings.get_strv(key)[0]),
    valign: Gtk.Align.CENTER,
    halign: Gtk.Align.CENTER,
  });
  settings.connect(`changed::${key}`, () => {
    label.set_accelerator(_normaliseAccel(settings.get_strv(key)[0]));
  });

  row.add_suffix(label);
  row.activatable_widget = label;

  row.connect('activated', () => {
    const ctl = new Gtk.EventControllerKey();
    const content = new Adw.StatusPage({
      title,
      description: 'Press the new shortcut combination.\nEscape or Backspace to cancel.',
      icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
    });
    const dialog = new Adw.Window({
      modal: true,
      transient_for: row.get_root(),
      hide_on_close: true,
      width_request: 360,
      height_request: 200,
      resizable: false,
      content,
    });
    dialog.add_controller(ctl);

    ctl.connect('key-pressed', (_ctl, keyval, keycode, state) => {
      let mask = state & Gtk.accelerator_get_default_mod_mask();
      mask &= ~Gdk.ModifierType.LOCK_MASK;

      if (!mask && (keyval === Gdk.KEY_Escape || keyval === Gdk.KEY_BackSpace)) {
        dialog.destroy();
        return Gdk.EVENT_STOP;
      }

      if (!isValidBinding(mask, keycode, keyval) || !isValidAccel(mask, keyval))
        return Gdk.EVENT_STOP;

      settings.set_strv(key, [Gtk.accelerator_name_with_keycode(null, keyval, keycode, mask)]);
      dialog.destroy();
      return Gdk.EVENT_STOP;
    });

    dialog.present();
  });
}

function addNumberRow(settings, group, title, subtitle, key) {
  const row = new Adw.ActionRow({ title, subtitle });
  group.add(row);
  const entry = new Gtk.Text({
    buffer: new Gtk.EntryBuffer({ text: String(settings.get_int(key)) }),
  });
  const save = () => settings.set_int(key, Number(entry.get_buffer().text));
  entry.connect('activate', save);
  const button = new Gtk.Button({ label: 'OK' });
  button.connect('clicked', save);
  row.add_suffix(entry);
  row.add_suffix(button);
  row.activatable_widget = entry;
}

function addSwitchRow(settings, group, title, key) {
  const row = new Adw.ActionRow({ title });
  group.add(row);
  const toggle = new Gtk.Switch({ active: settings.get_boolean(key), valign: Gtk.Align.CENTER });
  settings.bind(key, toggle, 'active', Gio.SettingsBindFlags.DEFAULT);
  row.add_suffix(toggle);
  row.activatable_widget = toggle;
}

function addStringRow(settings, group, title, subtitle, key) {
  const row = new Adw.ActionRow({ title, subtitle });
  group.add(row);
  const entry = new Gtk.Text({
    buffer: new Gtk.EntryBuffer({ text: settings.get_string(key) }),
    propagate_text_width: true,
  });
  const save = () => settings.set_string(key, entry.get_buffer().text);
  entry.connect('activate', save);
  const button = new Gtk.Button({ label: 'OK' });
  button.connect('clicked', save);
  row.add_suffix(entry);
  row.add_suffix(button);
  row.activatable_widget = entry;
}

// Preferences window.

export default class MyExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const s = this.getSettings();
        window._settings = s;

        // Page: Main
        const page_main = makePage(window, 'Main', 'window-new-symbolic');

        const mwGroup = makeGroup(page_main, 'Move window to New Workspace');
        addSwitchRow(s, mwGroup, 'Maximize window after moving to new workspace', 'move-window-maximize');
        addShortcutRow(s, mwGroup, 'Move window to New Workspace - Right', 'Default: Super+Control+Shift+Right', 'move-window-to-right-workspace');
        addShortcutRow(s, mwGroup, 'Move window to New Workspace - Left',  'Default: Super+Control+Shift+Left',  'move-window-to-left-workspace');

        const ewGroup = makeGroup(page_main, 'New Empty Workspace');
        addShortcutRow(s, ewGroup, 'New Empty Workspace - Right', 'Default: Control+Shift+Alt+Right', 'empty-workspace-right');
        addShortcutRow(s, ewGroup, 'New Empty Workspace - Left',  'Default: Control+Shift+Alt+Left',  'empty-workspace-left');

        const rwsGroup = makeGroup(page_main, 'Reorder-workspace');
        addShortcutRow(s, rwsGroup, 'Reorder-workspace - Right', 'Default: Control+Alt+Right', 'workspace-right');
        addShortcutRow(s, rwsGroup, 'Reorder-workspace - Left',  'Default: Control+Alt+Left',  'workspace-left');
        addSwitchRow(s, rwsGroup, 'Reorder-workspace shortcut will trigger Overview', 'move-workspace-triggers-overview');

        // snapRestore: remove with extension/snaprestore.js
        const srGroup = makeGroup(page_main, 'Snap restore (GNOME 49/50 workaround)');
        addSwitchRow(s, srGroup, 'Restore window size after un-snapping', 'snap-restore-fix');

        // Page: Window Manager
        const page_winman = makePage(window, 'Window Manager', 'focus-top-bar-symbolic');

        const toggleGroup = makeGroup(page_winman, 'Window management assistant');
        addSwitchRow(s, toggleGroup, 'Enable window management shortcuts', 'winman-toggle');
        addNumberRow(s, toggleGroup, 'Window gaps (pixels)', 'Default: 4', 'window-buffer');

        const topBarRow = new Adw.ComboRow({
          title: 'Top bar behaviour',
          subtitle: 'Whether to offset window positioning to avoid the GNOME top bar',
          model: Gtk.StringList.new(['Never', 'Always', 'Primary monitor only']),
        });
        toggleGroup.add(topBarRow);
        const indexToNick = ['never', 'always', 'primary'];
        const nickToIndex = { never: 0, always: 1, primary: 2 };
        topBarRow.set_selected(nickToIndex[s.get_string('top-bar-pref')] ?? 2);
        topBarRow.connect('notify::selected', () => s.set_string('top-bar-pref', indexToNick[topBarRow.selected]));

        for (const section of [
          { title: 'Move Windows - Inside Axis', suffix: '', mod: 'Control+Super' },
          { title: 'Move Windows - Outer Display Edge', suffix: '-edge', mod: 'Control+Super+Alt' },
        ]) {
          const group = makeGroup(page_winman, section.title);
          for (const [label, dir, key] of [
            ['Send window right', 'Right', 'window-right'],
            ['Send window left',  'Left',  'window-left'],
            ['Send window up',    'Up',    'window-up'],
            ['Send window down',  'Down',  'window-down'],
          ]) {
            addShortcutRow(s, group, label, `Default: ${section.mod}+${dir}`, key + section.suffix);
          }
        }

        for (const g of [
          { title: 'Primary window-size shortcut',        shortcutKey: 'resize-win',  shortcutDefault: 'Super+Space',       heightKey: 'window-height',  heightDefault: 50, widthKey: 'window-width',  widthDefault: 50 },
          { title: 'Alternative #1 window-size shortcut', shortcutKey: 'resize-win1', shortcutDefault: 'Super+Alt+2',       heightKey: 'window-height1', heightDefault: 50, widthKey: 'window-width1', widthDefault: 35 },
          { title: 'Alternative #2 window-size shortcut', shortcutKey: 'resize-win2', shortcutDefault: 'Super+Shift+Space', heightKey: 'window-height2', heightDefault: 50, widthKey: 'window-width2', widthDefault: 25 },
          { title: 'Alternative #3 window-size shortcut', shortcutKey: 'resize-win3', shortcutDefault: 'Super+Alt+4',       heightKey: 'window-height3', heightDefault: 50, widthKey: 'window-width3', widthDefault: 15 },
        ]) {
          const group = makeGroup(page_winman, g.title);
          addShortcutRow(s, group, 'Resize window', `Default: ${g.shortcutDefault}`, g.shortcutKey);
          addNumberRow(s, group, 'New window height after resize', `Percentage of monitor. Default: ${g.heightDefault}`, g.heightKey);
          addNumberRow(s, group, 'New window width after resize',  `Percentage of monitor. Default: ${g.widthDefault}`,  g.widthKey);
        }

        // Page: Highlight Focus
        const page_highlight = makePage(window, 'Highlight Focus', 'preferences-desktop-display-symbolic');

        const hlToggleGroup = makeGroup(page_highlight, 'Highlight Focus');
        addSwitchRow(s, hlToggleGroup, 'Enable highlight focus', 'highlight-toggle');
        addShortcutRow(s, hlToggleGroup, 'Manual highlight keybinding', 'Default: Super+B', 'highlight-keybinding');

        const hlStyleGroup = makeGroup(page_highlight, 'Border appearance');
        addStringRow(s, hlStyleGroup,  'Border color',  'CSS color value e.g. #ff0000', 'highlight-border-color');
        addNumberRow(s, hlStyleGroup,  'Border width',  'Pixels. Default: 4',            'highlight-border-width');
        addNumberRow(s, hlStyleGroup,  'Border radius', 'Pixels. Default: 6',            'highlight-border-radius');

        const hlBehaviourGroup = makeGroup(page_highlight, 'Behaviour');
        addSwitchRow(s, hlBehaviourGroup, 'Always show border (disable auto-hide)', 'highlight-disable-hiding');
        addNumberRow(s, hlBehaviourGroup, 'Hide delay', 'Milliseconds before border hides. Default: 1000', 'highlight-hide-delay');

        // Page: Focus Changer
        const page_focus = makePage(window, 'Focus Changer', 'go-next-symbolic');

        const fcToggleGroup = makeGroup(page_focus, 'Focus Changer');
        addSwitchRow(s, fcToggleGroup, 'Enable focus changer', 'focus-changer-toggle');

        const fcShortcutsGroup = makeGroup(page_focus, 'Directional shortcuts');
        addShortcutRow(s, fcShortcutsGroup, 'Focus window above', 'Default: Shift+Control+Alt+Up',    'focus-changer-up');
        addShortcutRow(s, fcShortcutsGroup, 'Focus window below', 'Default: Shift+Control+Alt+Down',  'focus-changer-down');
        addShortcutRow(s, fcShortcutsGroup, 'Focus window left',  'Default: Shift+Control+Alt+Left',  'focus-changer-left');
        addShortcutRow(s, fcShortcutsGroup, 'Focus window right', 'Default: Shift+Control+Alt+Right', 'focus-changer-right');

        // Page: About
        const aboutPage = makePage(window, 'About', 'help-about-symbolic');
        const aboutGroup = makeGroup(aboutPage, 'About');

        const aboutRow = new Adw.ActionRow({
          title: 'New Workspace Shortcut',
          subtitle: 'Version 501',
          activatable: true,
        });
        aboutRow.add_suffix(new Gtk.Image({ icon_name: 'go-next-symbolic', valign: Gtk.Align.CENTER }));
        aboutGroup.add(aboutRow);

        aboutRow.connect('activated', () => {
          const dialog = new Adw.AboutDialog({
            application_name: 'New Workspace Shortcut',
            application_icon: 'preferences-desktop-keyboard-shortcuts-symbolic',
            developer_name: 'barnscott',
            version: '501',
            website: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io',
            issue_url: 'https://github.com/barnscott/newworkspaceshortcut-barnix.io/issues',
            license_type: Gtk.License.GPL_2_0,
            comments: 'Keyboard shortcuts for workspace management, window repositioning, directional focus navigation, and focused-window highlighting.',
          });
          dialog.present(window);
        });
    }
}
