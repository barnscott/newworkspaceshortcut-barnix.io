# New Workspace Shortcut extension for Gnome Desktop

## TLDR
This extension will enable the following:

- Move-window-to-new-workspace Shortcut: 
  - Use a shortcut to move the in-focus window to a *new* workspace on the right of your current workspace: `Super + Alt + Shift + n`
  - Or to the left / *backward*: `Super + Alt + Shift + b`
- New-empty-workspace Shortcut:
  - Use a shortcut to create an *empty* workspace on the right: `Super + Alt + n`
  - Or to the left / *backward*: `Super + Alt + b`
- Reorder-workspace Shortcut:
  - Use a shortcut to move an entire workspace left or right of the current workspace: `Ctl + Super + Left` or `Ctl + Super + Right`
  - By default, this shorcut with automatically trigger the Overview to provide a limited form of visual feedback. However, this preference can be changed via the extension's Settings panel.

These shortcuts are created to work logically with the vanilla gnome shortcuts including change-workspace (`Super + ALT + Left/Right`) and move-window-to-next-workspace (`Shift + Super + ALT + Left/Right`).

## Purpose

This extension provides a shortcut that will move the active window to a new workspace that is to the right/left of the current workspace. Alternativly, you can also create an empty workspaces.

This is useful, for example, if you have 3 populated workspaces, but you want to move a window that is on workspace-1 to a new and empty workspace to the right of workspace-1.

Without this extension, you can create a new workspace between two existing workspaces with your mouse by (1) entering Overview, (2) with your mouse, grab/drag a window from an existing workspace, (3) and drop the window inbetween existing workspace-thumbnails of the Overview.

However, I was looking for similar functionality with a keyboard shortcut, which does not currently exist on vanilla Gnome.

Additionally, this extension provides shortcuts to move your active Workspace left and right.

## Prereqs

Currenlty, this extention is only tested on the following releases

- Gnome 41

## How to use

After installing the extension, simply use the shortcuts. There are not currently any UI elements available.

## How to install

### GNOME Extensions Website

This extension is available on [GNOME Extensions Website](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/).

[![Available on extensions.gnome.org](img/gnome.svg)](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/)

### Manual Installation

Use the following commands to install this extension:

```
# change-directory to your home, or your prefered directory
cd ~ 

# copy down the source code repository
git clone git@github.com:barnscott/newworkspaceshortcut-barnix.io.git

# symbolic-link the extention-code to the extension directory
ln -s $PWD/newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io ~/.local/share/gnome-shell/extensions/newworkspaceshortcut@barnix.io

# if on X11, reset shell with ALT-F2 and enter "r". On Wayland, see note below.
# then, enable the extension. 
gnome-extensions enable newworkspaceshortcut@barnix.io
```
If you are on Wayland, after you complete the  installation, you may need to log-out and log-in for the shell to register the key-bindings.

## To do

I would like to add the following features, but don't have any priority on doing so:

- [ ] Code cleanup / optimization
  
- [ ] Add a extension preferences window to allow to modify shortcut key binding
  