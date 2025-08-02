# 481 (Aug 2025)
## CHANGES
- Make the focused window always visible on the screen when moving it to a new created workspace

# 480 (Apr 2025)
## CHANGES
- Gnome 48 

# 471 (Sept 2024)
## CHANGES
- Add shortcuts to move windows to display edges to override native DE shortcuts so that optional buffers/gaps are respected
- Refactor a bit of code
- Reorganize Prefs panel a little bit

# 470 (Sept 2024)
## CHANGES
- Gnome 47

# 46.6 (Jul 2024)
## CHANGES
- Add shortcuts for additional window-resizes

# 46.5 (June 2024)
## CHANGES
- Improve buffer implementation

# 46.4 (June 2024)
## CHANGES
- Adjust Top Bar offset for optional tiler feature

# 46.3 (Apr 2024)
## NEW
- Added ability to customize width, height, and buffer of window via the settings panel
- Window-management-assistant now offsets for the top bar
## CHANGES
- Minor enhancements to the usibility to settings panel

# 46.2 (Mar 2024)
## CHANGES
- Added functionality to disable/enable window-managment for minimal-tiling. Features are now disabled dy default and require user to enable via the extensions settings panel.
- Modified the defaults for some of shortcuts, including: (1) New-empty-workspace shortcut and (2) Window-mangement-assitant shortcuts
## New
- Added basic functionality to modify shortcuts via the setting's panel

# 46.1 (Mar 2024)
## CHANGES
- Added minimal tiling features to v46.0 release

# 46.0 (Mar 2024)
## CHANGES
- Change versioning schema to better match Gnome release
- Add Gnome46 support to previous release

# 0.7.0 (Nov 2023)
## CHANGES
- This version only supports Gnome45
- Older versions of Gnome are not supported in this version

# 0.6.0 (Feb 2023)
## CHANGES
- This version only supports Gnome44
- Older versions of Gnome are not supported in this version

# 0.5.0 (Sept 2022)
## CHANGES
- Support for Gnome43 added
- Gnome 41-43 supported

# 0.4
## CHANGES
- Changed shortcut mapping for "New Workspace Shortcut" and "New Empty Workspace Shortcut"
- Added shortcut listings to Settings panel

# 0.3
## CHANGES
- By default, using the shortcut to rearrage the workspaces will automatically trigger the Overview view
## NEW FEATURES
- Settings panel has a new toggle to disable the triggering the Overview when moving Workspaces with the shortcut
## Misc
- Minor code and Readme cleanup

# 0.2.2
## NEW FEATURES
- Add a simple Settings Panel with a links to the Github page

# 0.2.1
## Misc
- Minor code cleanup

# 0.2
## CHANGES
- The shortcut to move an entire workspace left/right has been changes to `CTL+SUPER+Left/Right`. This was previously `ALT+Left/Right`, but conflicted with other app shortcuts.
## NEW FEATURES
- New shortcut to move a window to the left workspace: `Super + Alt + Shift + b`. This shortcut should be logical when compared with the existing shortcut to move windows right: `Super + Alt + Shift + n`
- New shortcut to create new `empty` workspace on the right: `Super + Alt + n`
- New shortcut to create new `empty` workspace on the left: `Super + Alt + b`

# 0.1
- First release
- Basic functionality for 2 features: new workspace shortcut, and moving workspaces.
- Re-org directory structure and updated Install instructions
