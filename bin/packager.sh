#!/usr/bin/env bash
#
# packager.sh — bundle the GNOME Shell extension into a zip ready for upload
# to extensions.gnome.org (EGO).
#
# The archive is named from the "version" in metadata.json and written to the
# destination directory (default: ~/Downloads/newworkspaceshortcut@barnix.io),
# matching the layout of previous releases:
#
#   newworkspaceshortcut<version>.zip
#     ├── metadata.json          (at archive root — required by EGO)
#     ├── extension.js
#     ├── prefs.js
#     ├── stylesheet.css
#     ├── extension/*.js
#     └── schemas/*.gschema.xml  (source only; EGO compiles on install)
#
# Usage: bin/packager.sh [dest-dir]

set -euo pipefail

readonly UUID="newworkspaceshortcut@barnix.io"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

main() {
  local script_dir repo_root ext_dir dest_dir version zip_name zip_path

  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  repo_root=$(dirname "$script_dir")
  ext_dir="$repo_root/$UUID"
  dest_dir="${1:-$HOME/Downloads/$UUID}"

  [[ -d "$ext_dir" ]] || die "extension dir not found: $ext_dir"
  [[ -f "$ext_dir/metadata.json" ]] || die "metadata.json not found in $ext_dir"

  version=$(grep -oE '"version"[[:space:]]*:[[:space:]]*[0-9]+' "$ext_dir/metadata.json" \
    | grep -oE '[0-9]+$' || true)
  [[ -n "$version" ]] || die "could not read integer \"version\" from metadata.json"

  # Assemble the list of items to ship, relative to the extension root.
  # gschemas.compiled is deliberately omitted — EGO rebuilds schemas, and prior
  # releases shipped only the .gschema.xml source.
  local -a files=()
  local item

  # Mandatory — EGO rejects an upload without these.
  for item in "metadata.json" "extension.js"; do
    [[ -e "$ext_dir/$item" ]] || die "missing required item: $item"
    files+=("$item")
  done

  # Optional — included only if present (e.g. stylesheet.css was dropped in 502).
  for item in "prefs.js" "stylesheet.css" "extension"; do
    if [[ -e "$ext_dir/$item" ]]; then
      files+=("$item")
    else
      echo "note: skipping absent optional item: $item" >&2
    fi
  done

  # Schema source(s) — included if present, compiled artifact excluded.
  local schema found_schema=0
  for schema in "$ext_dir"/schemas/*.gschema.xml; do
    [[ -e "$schema" ]] || continue
    files+=("schemas/$(basename "$schema")")
    found_schema=1
  done
  (( found_schema )) || echo "note: no schemas/*.gschema.xml found" >&2

  mkdir -p "$dest_dir"
  zip_name="newworkspaceshortcut${version}.zip"
  zip_path="$dest_dir/$zip_name"
  rm -f "$zip_path"

  # Build from inside the extension dir so paths are stored relative to the
  # extension root (metadata.json must sit at the archive root for EGO).
  (
    cd "$ext_dir"
    zip --recurse-paths -X "$zip_path" "${files[@]}" \
      -x '*/.DS_Store' '*~' '*.swp' >/dev/null
  )

  echo "Packaged v${version} -> $zip_path"
  echo
  unzip -l "$zip_path"
}

main "$@"
