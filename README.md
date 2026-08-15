

# New Workspace Shortcut — GNOME Extension

Keyboard shortcuts for workspace management, window repositioning, directional focus navigation, and focused-window highlighting.

Available on [GNOME Extensions](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/).

[![Available on extensions.gnome.org](img/gnome.svg)](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/)

---

## Features

### Workspace shortcuts

| Action | Default shortcut |
|---|---|
| Move focused window to new workspace (right) | `Super + Control + Shift + Right` |
| Move focused window to new workspace (left) | `Super + Control + Shift + Left` |
| Create empty workspace (right) | `Control + Shift + Alt + Right` |
| Create empty workspace (left) | `Control + Shift + Alt + Left` |
| Reorder current workspace right | `Control + Alt + Right` |
| Reorder current workspace left | `Control + Alt + Left` |

Workspace shortcuts complement GNOME's built-in bindings: switch workspace (`Super + Alt + Left/Right`) and move window to adjacent workspace (`Shift + Super + Alt + Left/Right`).

The reorder shortcut can optionally trigger the Overview for visual feedback — configurable in the preferences panel.

The move-to-new-workspace shortcut has an optional toggle to maximize the window on arrival — disabled by default, configurable in the preferences panel.

---

### Window Manager

> **Disabled by default.** Enable via the preferences panel under *Window Manager*.

Repositions and resizes floating windows along the center axes of the display.

**Move to display half** (`Control + Super + Arrow`):

| Shortcut | Result |
|---|---|
| `Control + Super + Right` | Right half of display |
| `Control + Super + Left` | Left half of display |
| `Control + Super + Up` | Top half of display |
| `Control + Super + Down` | Bottom half of display |

**Move to display edge** (`Control + Super + Alt + Arrow`):

These re-implement GNOME's native `move-to-side-*` shortcuts so they respect the configurable window gap.

| Shortcut | Result |
|---|---|
| `Control + Super + Alt + Right` | Right edge |
| `Control + Super + Alt + Left` | Left edge |
| `Control + Super + Alt + Up` | Top edge |
| `Control + Super + Alt + Down` | Bottom edge |

**Resize window** — up to four configurable size presets, each binding a shortcut to a target width/height (as a percentage of the monitor).

| Shortcut | Default size |
|---|---|
| `Super + Space` | 50% × 50% |
| `Super + Alt + 2` | 50% × 35% |
| `Super + Shift + Space` | 50% × 25% |
| `Super + Alt + 4` | 50% × 15% |

All window positions account for a configurable pixel gap (*Window gaps*, default 4 px) and respect the GNOME top bar via the *Top bar behaviour* setting (`Primary monitor only` / `Always` / `Never`).

---

### Highlight Focus

> **Disabled by default.** Enable via the preferences panel under *Highlight Focus*.

Draws a temporary border around the focused window whenever focus changes, making it easy to locate the active window at a glance.

- Border color, width, and corner radius are configurable.
- The border auto-hides after a configurable delay (default 1000 ms). Auto-hide can be disabled to keep the border permanently visible.
- A manual keybinding (`Super + B` by default) re-triggers the highlight on demand.
- No border is drawn when the focused window is fully maximized.

---

### Focus Changer

> **Disabled by default.** Enable via the preferences panel under *Focus Changer*.

Moves keyboard focus between windows by geometric direction — without cycling through a list.

| Shortcut | Action |
|---|---|
| `Shift + Control + Alt + Up` | Focus window above |
| `Shift + Control + Alt + Down` | Focus window below |
| `Shift + Control + Alt + Left` | Focus window to the left |
| `Shift + Control + Alt + Right` | Focus window to the right |

Focus selection prefers the window closest along the direction of travel, using perpendicular distance as a tiebreaker. When no window exists on the current monitor in the given direction, focus moves to the nearest monitor in that direction.

---

## Configuration

All shortcuts and feature settings are configurable via the preferences panel (`gnome-extensions prefs newworkspaceshortcut@barnix.io`).

Click any shortcut row to open a capture dialog, then press the desired key combination. Press `Escape` or `Backspace` to cancel.

### Programmatic configuration

Settings are stored in GSettings under `org.gnome.shell.extensions.newworkspaceshortcut`. To set a value from the command line, include the schema directory:

```bash
gsettings --schemadir ~/.local/share/gnome-shell/extensions/newworkspaceshortcut@barnix.io/schemas/ \
  set org.gnome.shell.extensions.newworkspaceshortcut top-bar-pref 'primary'
```

Available values for `top-bar-pref`: `primary` (default), `always`, `never`.

---

## Installation

### GNOME Extensions website

Install directly from [extensions.gnome.org](https://extensions.gnome.org/extension/4597/new-workspace-shortcut/).

### Manual installation

```bash
git clone git@github.com:barnscott/newworkspaceshortcut-barnix.io.git
ln -s $PWD/newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io \
  ~/.local/share/gnome-shell/extensions/newworkspaceshortcut@barnix.io
glib-compile-schemas newworkspaceshortcut-barnix.io/newworkspaceshortcut@barnix.io/schemas/
gnome-extensions enable newworkspaceshortcut@barnix.io
```

On Wayland, log out and back in after installation if keybindings are not registered.

---

## Contributing

Before submitting a PR:

- Update `CHANGELOG.md` with a summary of the changes.
- Update `metadata.json` to reflect the supported GNOME versions.

### Build and debugging

```bash
# Nested Wayland session for live testing
dbus-run-session -- gnome-shell --nested --wayland

# Tail shell logs
journalctl -f -o cat /usr/bin/gnome-shell

# Reload the extension
gnome-extensions disable newworkspaceshortcut@barnix.io
gnome-extensions enable newworkspaceshortcut@barnix.io
```

See `CHANGELOG.md` for version history and supported GNOME versions.
