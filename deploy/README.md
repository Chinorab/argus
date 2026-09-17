# Deploying Argus on Nebius AI Cloud

Argus is a Next.js app whose models are served by Nebius Token Factory, so the host needs no GPU:
a small CPU virtual machine on Nebius AI Cloud runs the whole thing in Docker.

## 1. Create the virtual machine (Nebius console)

1. Open https://console.nebius.com → **Compute** → **Virtual machines** → **Create**.
2. Platform: **CPU** (e.g. `cpu-d3`), 2 vCPU / 8 GB RAM is plenty. Boot disk: Ubuntu 22.04 or 24.04, 40 GB.
3. Network: attach a **public IPv4 address**.
4. Access: add your SSH public key (`~/.ssh/id_ed25519.pub`), user name e.g. `ubuntu`.
5. Create, then note the public IP.

Open ports 80 and 443 in the VM's security group / firewall if the console asks.

## 2. Install and start

SSH into the VM and run the one-shot setup:

```bash
ssh ubuntu@<PUBLIC_IP>
curl -fsSL https://raw.githubusercontent.com/Chinorab/argus/main/deploy/setup-vm.sh | bash
```

It installs Docker, clones the repository into `/opt/argus` and creates `/opt/argus/.env`.
Set the key, then start:

```bash
nano /opt/argus/.env          # NEBIUS_API_KEY=...   (and DOMAIN=argus.example.com for HTTPS)
cd /opt/argus && sudo docker compose up -d --build
```

The first build takes 2-3 minutes. Argus then answers on `http://<PUBLIC_IP>/` (or on the
domain with automatic HTTPS if `DOMAIN` is set and its DNS A record points at the VM).

## 3. Update to the latest version

```bash
bash /opt/argus/deploy/update.sh
```

## Notes

- The API key lives only in `/opt/argus/.env` on the VM (never in the image or the repository).
- Inspections stream over Server-Sent Events for up to a few minutes; the Caddy config disables
  buffering and raises the proxy timeouts accordingly.
- Logs: `sudo docker compose -f /opt/argus/docker-compose.yml logs -f app`.
