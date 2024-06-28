# New Workspace Shortcut extension for Gnome Desktop

# Workspace shortcuts

- Move-window-to-new-workspace Shortcut: 
  - Use a shortcut to move the in-focus window to a *new* workspace on the right of your current workspace: `Ctl + Super + Shift + Right`
  - Or to the left / *backward*: `Ctl + Super + Shift + Left`
- New-empty-workspace Shortcut:
  - Use a shortcut to create an *empty* workspace on the right: `Ctl + Shift + Alt + Right` (Changed in `v46.2`, March 2024)
  - Or to the left / *backward*: `Ctl + Shift + Alt + Left` (Changed in `v46.2`, March 2024)
- Reorder-workspace Shortcut:
  - Use a shortcut to move an entire workspace left or right of the current workspace: `Ctl + Super + Left` or `Ctl + Super + Right`
  - By default, this shortcut with automatically trigger the Overview to provide a limited form of visual feedback. However, this preference can be changed via the extension's Settings panel.

These shortcuts are created to work logically with the vanilla gnome shortcuts including change-workspace (`Super + ALT + Left/Right`) and move-window-to-next-workspace (`Shift + Super + ALT + Left/Right`).

# Window shortcuts

## Repositioning floating windows
`NOTE:` These shortcuts are DISABLED by default, and must be enabled via the extension's settings panel.

These shortcuts enable repositioning of floating windows along the center X and Y axis of the display. They are intended to be a minimal enhancement to the default window-management shortcuts (ie, `begin-resize`, `begin-move`, `move-to-side-e`, etc) that are available natively in Gnome. If you are not familiar with the native Gnome shortcuts, see the following section, `Native Gnome window management shortcuts`.

- `Super + Space` will resize window to 40% width by 45% height. These dimensions can be modified in the settings-panel.
- `Control + Super` and `arrow-key` key will relocate the window to the applicable half of the display. The window will be anchored to the center of the display.
  - `Control + Super + right` will relocate window to right side of the *center of the x-axis* of the display
  - `Control + Super + left` will relocate window to left side of the *center of the x-axis* of the display
  - `Control + Super + up` will relocate window to top side of the *center of the y-axis* of the display
  - `Control + Super + down` will relocate window to bottom side of the *center of the y-axis* of the display

## Native Gnome window management shortcuts

This extension's shortcuts are designed to extend the window-management bindings that exist natively in Gnome, but may not be configured out-of-the-box. Below is incomplete list of the native Gnome bindings that this extension extends. Additionally, you can use the application `dconf Editor` to customize these shortcuts.
```bash
gsettings get org.gnome.desktop.wm.keybindings begin-resize
gsettings get org.gnome.desktop.wm.keybindings begin-move
gsettings get org.gnome.desktop.wm.keybindings move-to-center
gsettings get org.gnome.desktop.wm.keybindings move-to-side-e
gsettings get org.gnome.desktop.wm.keybindings move-to-side-n
gsettings get org.gnome.desktop.wm.keybindings move-to-side-s
gsettings get org.gnome.desktop.wm.keybindings move-to-side-w
gsettings get org.gnome.desktop.wm.keybindings move-to-corner-ne
gsettings get org.gnome.desktop.wm.keybindings move-to-corner-nw
gsettings get org.gnome.desktop.wm.keybindings move-to-corner-se
gsettings get org.gnome.desktop.wm.keybindings move-to-corner-sw
gsettings get org.gnome.desktop.wm.keybindings maximize-vertically
gsettings get org.gnome.desktop.wm.keybindings maximize-horizontally
gsettings get org.gnome.desktop.wm.preferences resize-with-right-button
```
Below is an example of how to customize these Gnome shortcuts:
```bash
gsettings set org.gnome.desktop.wm.keybindings begin-resize "['<Alt>F8', '<Control><Super><Alt>Space']"
```

# How to modify default shortcut bindings

Changes to the shortcut bindings can be applied via the setting's panel of the extension. This is not any robust error handling, so ensure the syntax of the shortcut is applied correctly, or the binding will fail to perform.

Example format for setting shortcuts: `<Super><Control><Shift>Right`

# Changes

See `CHANGELOG.md` to identify changes in newer releases. Releases after `v46.0` including changes to some shortcut bindings.

# Supported Gnome versions

This version of this extension is tested on the following Gnome releases:

- 46
- 45

See `CHANGELOG.md` to identify which versions of this extension support which versions of Gnome.

# How to use

After installing the extension, simply use the shortcuts.

# How to install

## GNOME Extensions Website

This extension is available on [GNOME Extensions Website](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/).

[![Available on extensions.gnome.org](img/gnome.svg)](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/)

## Manual Installation

Use the following commands to install this extension:

Change-directory to your preferred working directory
```bash
cd ~ 
```

Copy down the source code repository
```bash
git clone git@github.com:barnscott/newworkspaceshortcut-barnix.io.git
```

Symbolic-link the extension-code to the extension directory
```bash
ln -s $PWD/newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io ~/.local/share/gnome-shell/extensions/newworkspaceshortcut@barnix.io
```

Compile the schema
```bash
glib-compile-schemas newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io/schemas/
```

If on X11, reset shell with ALT-F2 and enter "r". On Wayland, see note below.
Then, enable the extension. 
```bash
gnome-extensions enable newworkspaceshortcut@barnix.io
```
If you are on Wayland, after you complete the  installation, you may need to log-out and log-in for the shell to register the key-bindings.

# Contribution guidelines

When creating a PR, review the following files and make changes as necessary:

- Update the "Supported Gnome versions" section on this `README.md`
- Update `CHANGELOG.md` with a summary of the changes

## Build testing/debugging

Eliminate any errors caused by the extension before submitting PR. Debugging workflow may include:

This command will open a nested Gnome shell. On the console where this command is executed, you can read real-time errors of the nested shell.
```bash
dbus-run-session -- gnome-shell --nested --wayland
```

Additional commands:

CLI reference for reading shell logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```
CLI reference for disabling/enabling extension:
```bash
gnome-extensions disable newworkspaceshortcut@barnix.io
gnome-extensions enable newworkspaceshortcut@barnix.io
```

# To do

I would like to add the following features, but don't have any priority. Feel free to send a PR.

- [ ] Code cleanup / optimization
- [ ] Improve the look and user-experience of the setting's panel
