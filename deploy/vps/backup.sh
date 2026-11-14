#!/usr/bin/env bash
# Codzienna kopia wolumenu panelu, retencja 30 dni.
set -euo pipefail
DEST=/var/backups/novopix
mkdir -p "$DEST"
STAMP=$(date +%Y%m%d-%H%M)
docker run --rm -v novopix_panel-data:/data:ro -v "$DEST":/out alpine \
  tar czf "/out/panel-data-$STAMP.tar.gz" -C /data .
find "$DEST" -name 'panel-data-*.tar.gz' -mtime +30 -delete
