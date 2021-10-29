# New Workspace Shortcut extension for Gnome Desktop

## TLDR
This shortcut can:
- Use a shortcut to move a window to a new and empty workspace on the right of your current workspace: `Meta-Key + Alt + Shift + n`
- Use a shortcut to move an entire workspace left or right of the current workspace: `ALT+Left` <or> `ALT+Right`

## Purpose

This extension provides a shortcut that will move the active window to a new workspace that is to the right of the current workspace.

This is useful, for example, if you have 3 populated workspaces, but you want to move a window that is on workspace-1 to a new and empty workspace to the right of workspace-1.

While vanilla Gnome provides mouse functionalty for this task, a keyboard shortcut is not available.

Additionally, there are  shortcuts to move Workspace left and right. Sometimes this is handy too! This second feature was an afterthought since I saw the reorder workspace method in the documentation for gjs.

## Backstory

Without this extension, you can create a new workspace between two existing workspaces with your mouse by (1) entering Overview, (2) with your mouse, grab/drag a window from an existing workspace, (3) and drop the window inbetween existing workspace-thumbnails of the Overview.

However, I was looking for similar functionality with a keyboard shortcut, which does not currently exist on vanilla Gnome.

## Prereqs

Currenlty, this extention is only tested on the following releases

- Gnome 41

## How to use

After installing the extension, simply use the shortcuts. There are not currently an UI elements available.

## How to install

Use the following commands to install this extension:

```
cd .local/share/gnome-shell/extensions/

git clone git@github.com:barnscott/newworkspaceshortcut-barnix.io.git

mv newworkspaceshortcut-barnix.io.git newworkspaceshortcut@barnix.io.git

gnome-extensions enable newworkspaceshortcut@barnix.io
```

## To do

I would like to add the following features, but don't have any priority on doing so:

- [ ] Code cleanup / optimization
  
- [ ] Add a extension preferences window to allow to modify shortcut key binding
  
- [ ] Integrate with the Gnome Keyboard shortcuts settings panel