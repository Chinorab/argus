#!/usr/bin/env bash
# One-shot setup of a fresh Ubuntu VM on Nebius AI Cloud: Docker, clone, first start.
#   curl -fsSL https://raw.githubusercontent.com/Chinorab/argus/main/deploy/setup-vm.sh | bash
set -euo pipefail

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

sudo mkdir -p /opt/argus && sudo chown "$USER" /opt/argus
if [ ! -d /opt/argus/.git ]; then
  git clone https://github.com/Chinorab/argus.git /opt/argus
fi
cd /opt/argus

if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo ">> Edit /opt/argus/.env and set NEBIUS_API_KEY (and DOMAIN if you have one), then run:"
  echo "   cd /opt/argus && sudo docker compose up -d --build"
  exit 0
fi

sudo docker compose up -d --build
echo ">> Argus is starting. Check: sudo docker compose logs -f app"
