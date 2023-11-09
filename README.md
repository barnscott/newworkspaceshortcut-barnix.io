# New Workspace Shortcut extension for Gnome Desktop

# TLDR
This extension will enable the following:

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

# Purpose

This extension provides a shortcut that will move the active window to a new workspace that is to the right/left of the current workspace. Alternatively, you can also create an empty workspaces.

This is useful, for example, if you have 3 populated workspaces, but you want to move a window that is on workspace-1 to a new and empty workspace to the right of workspace-1.

Without this extension, you can create a new workspace between two existing workspaces with your mouse by (1) entering Overview, (2) with your mouse, grab/drag a window from an existing workspace, (3) and drop the window in between existing workspace-thumbnails of the Overview.

However, I was looking for similar functionality with a keyboard shortcut, which does not currently exist on vanilla Gnome.

Additionally, this extension provides shortcuts to move your active Workspace left and right.

# Supported Gnome versions

See `CHANGELOG.md` to identify which versions of this extension support which versions of Gnome.

# How to use

After installing the extension, simply use the shortcuts. There are not currently any UI elements available.

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

```bash
dbus-run-session -- gnome-shell --nested --wayland
```
Open a terminal within the nested session:
```bash
journalctl -f -o cat /usr/bin/gnome-shell
```
In a second terminal of the nested session:
```bash
gnome-extensions disable newworkspaceshortcut@barnix.io
gnome-extensions enable newworkspaceshortcut@barnix.io
```

# To do

I would like to add the following features, but don't have any priority. Feel free to send a PR.

- [ ] Code cleanup / optimization
- [ ] Add ability to modify shortcut bindings on the extension's preferences window
  