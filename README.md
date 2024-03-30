# New Workspace Shortcut extension for Gnome Desktop

# TLDR
This extension will enable the following:

## Core features

- Move-window-to-new-workspace Shortcut: 
  - Use a shortcut to move the in-focus window to a *new* workspace on the right of your current workspace: `Ctl + Super + Shift + Right`
  - Or to the left / *backward*: `Ctl + Super + Shift + Left`
- New-empty-workspace Shortcut:
  - Use a shortcut to create an *empty* workspace on the right: `Ctl + Super + Alt + Right`
  - Or to the left / *backward*: `Ctl + Super + Alt + Left`
- Reorder-workspace Shortcut:
  - Use a shortcut to move an entire workspace left or right of the current workspace: `Ctl + Super + Left` or `Ctl + Super + Right`
  - By default, this shortcut with automatically trigger the Overview to provide a limited form of visual feedback. However, this preference can be changed via the extension's Settings panel.

These shortcuts are created to work logically with the vanilla gnome shortcuts including change-workspace (`Super + ALT + Left/Right`) and move-window-to-next-workspace (`Shift + Super + ALT + Left/Right`).

## Minimal floating-window quadrant tiler

- `Super + Space` will resize window to 40% width by 45% height. This is preferable for 16:9 displays.
- `Ctl + Shift` and `arrow-key` key will relocate the window to the applicable half of the display. The window will be justified to the center of the applicable axis. There is also a minimal gap applied to offset the center alignment.
  - Using `Ctl + Shift + right` will relocate window to right side of the *center of the x-axis* of the display
  - Using `Ctl + Shift + left` will relocate window to left side of the *center of the x-axis* of the display
  - Using `Ctl + Shift + up` will relocate window to top side of the *center of the y-axis* of the display
  - Using `Ctl + Shift + down` will relocate window to bottom side of the *center of the y-axis* of the display

Using these keys together, the user can quickly slide windows around the existing workspace

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
- [ ] Add ability to modify shortcut bindings on the extension's preferences window
- [ ] Add top bar offset to Tiler up/down shortcuts
