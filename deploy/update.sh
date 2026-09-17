#!/usr/bin/env bash
# Pull the latest main and rebuild the running stack.
set -euo pipefail
cd /opt/argus
git pull --ff-only
sudo docker compose up -d --build
sudo docker image prune -f >/dev/null
