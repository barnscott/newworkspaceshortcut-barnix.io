# 503 (Sep 2026)
## CORRECTION TO THE 502 NOTE BELOW
- **The 502 entry misdiagnosed its own bug.** It claimed Highlight Focus interfered with GNOME's native window restore (`Super + Down`) after snapping. It does not, and cannot: an actor added to `global.window_group` has no code path to Mutter's saved geometry, and Mutter's compositor explicitly tolerates foreign actors in that group.
- **The real cause is an upstream Mutter regression**, present from 49.1 through 50.x. Keyboard tiling (`Super + Left` / `Super + Right`) commits the tile mode to the window before saving its geometry, so the pre-tile size is never recorded and `Super + Down` restores a stale rectangle. Tracked upstream as [mutter#4481](https://gitlab.gnome.org/GNOME/mutter/-/issues/4481) and [mutter#4918](https://gitlab.gnome.org/GNOME/mutter/-/issues/4918). The root cause cannot be fixed from an extension, but this release compensates for it — see below.
- **Manual fallback**, if the new *Restore window size after un-snapping* setting is turned off: press `Super + Up` then `Super + Down` while the window is still floating, *before* tiling it. That records the geometry through a path the regression does not affect.
- Removing the `size-change` handler in 502 was still correct, for a different reason: Mutter emits `size-change` synchronously part-way through a tile transition, so a handler that redraws there reads a rectangle that is neither the old nor the new one.

## BUG FIXES
- Highlight Focus no longer draws a border on snapped, maximized or fullscreen windows. Mutter models a side snap as a vertical-only maximize, so the previous both-axes check never matched a snap and the border was drawn flush to the screen edges, clipped.
- Highlight Focus now removes a stale border when the focused window is snapped, maximized or made fullscreen. Snapping fires no focus change, so a border drawn beforehand previously stayed at the old coordinates until the hide delay expired — indefinitely with auto-hide disabled.
- The Window Manager feature no longer overwrites its saved native keybindings with empty values. If GNOME Shell exited without running the extension's cleanup, `move-to-side-*` were left empty in dconf and the next enable saved those empty values as the originals, permanently losing the user's bindings.
- Highlight Focus no longer logs `Source ID N was not found when attempting to remove it` to the journal. The auto-hide timer left its source id in the pending list after firing, so the next highlight passed a dead source to `GLib.Source.remove()`.
- Windows snapped with `Super + Left` / `Super + Right` now return to their previous size and position on `Super + Down`. GNOME 49 and 50 never record the pre-snap geometry, so the extension records it and reapplies it when the window is un-snapped.
- The Window Manager toggle is now migrated from the pre-471 `tiler-toggle` key. Release 471 (Sept 2024) renamed it to `winman-toggle` with no migration, silently disabling all fourteen Window Manager keybindings on upgrade for anyone who had enabled the feature before then.

## CHANGES
- New setting *Restore window size after un-snapping* (Preferences → Main → Snap restore), enabled by default. Inert outside GNOME 49/50 and disabled automatically on GNOME 51 and later.
- Supported GNOME versions are now 49 and 50. Releases 45–48 were declared but never exercised, and `move-window-maximize` has been broken on them since 502 — `meta_window_maximize()` required a directions argument before GNOME 49.

# 502 (Jun 2026)
## BUG FIXES
- Highlight Focus now reacts only to focus changes. It previously also reacted to window size changes (resize/maximize/tile), which interfered with GNOME's native window restore (`Super + Down`) after snapping a window to a display half — the window kept the snapped position instead of returning to its original location.

# 501 (May 2026)
## NEW FEATURES
- Highlight Focus: draws a configurable border around the focused window on focus change; auto-hides after a configurable delay. Disabled by default, enabled via the Preferences panel.
- Focus Changer: moves keyboard focus between windows by geometric direction (up/down/left/right); navigates across monitors. Disabled by default, enabled via the Preferences panel.
- Move to new workspace: optional toggle to automatically maximize the window after it is moved to a new workspace. Disabled by default.
## CHANGES
- About page now uses native Adw.AboutDialog (application name, version, license, website, issue tracker)
- Keyboard shortcut capture: all shortcut fields in the Preferences panel now use a click-to-capture dialog instead of a text entry field
- Top bar behaviour setting is now exposed in the Preferences panel (previously only configurable via gsettings)
- Highlight Focus default keybinding: Super+B; border color: #99c1f1; border width: 4px
- Focus Changer default shortcuts: Shift+Control+Alt+Arrow
- Shortcut display in preferences now validates stored values before rendering, preventing blank rows for manually-set bindings
- Refactor: fixed signal handler leak on repeated disable/enable cycles
- Refactor: native GNOME keybindings (`move-to-side-*`) are now correctly restored when the Window Manager feature is disabled
- Refactor: window manager operations no longer crash when no window is focused

# 500 (Mar 2026)
## CHANGES
- Gnome 50 support

# 490 (Oct 2025)
## CHANGES
- Gnome 49 support

# 483 (Aug 2025)
## CHANGES
- Bug fix for WindowManager - after using a Gnome shortcut to move a window between multiple monitors, this extension would detect the wrong monitor for use with the Window Manager

# 482 (Aug 2025)
## CHANGES
- Top-bar enhancement so that top-bar offset is only implemented on the primary display
- This setting can be overridden with a gsettings key, captured in README. Not exposed in Preferences Applet, as I do not know if there is a valid usecase for it.

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
