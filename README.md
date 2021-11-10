# New Workspace Shortcut extension for Gnome Desktop

## TLDR
This shortcut can:
- Use a shortcut to move a window to a new and empty workspace on the right of your current workspace: `Super + Alt + Shift + n`
- Use a shortcut to move an entire workspace left or right of the current workspace: `ALT+Left` <or> `ALT+Right`. As there is not any UI feedback for this event, you will want to be in the Overview so you can see your Workspace-Thumbnail moving left and right. 

## Purpose

This extension provides a shortcut that will move the active window to a new workspace that is to the right of the current workspace.

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

Use the following commands to install this extension:

```
# change-directory to your home, or your prefered directory
cd ~ 

# copy down the source code repository
git clone git@github.com:barnscott/newworkspaceshortcut-barnix.io.git

# symbolic-link the extention-code to the extension directory
ln -s newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io ~/.local/share/gnome-shell/extensions/newworkspaceshortcut@barnix.io

# if on X11, reset shell with ALT-F2 and enter "r". On Wayland, see note below.
# then, enable the extension. 
gnome-extensions enable newworkspaceshortcut@barnix.io
```
If you are on Wayland, after you complete the  installation, you may need to log-out and log-in for the shell to register the key-bindings.

## To do

I would like to add the following features, but don't have any priority on doing so:

- [ ] Code cleanup / optimization
  
- [ ] Add a extension preferences window to allow to modify shortcut key binding
  