#!/bin/bash
set -e

# ==========================================
# Configuration du dépôt ValOS
# ==========================================
GITHUB_REPO="https://github.com/valyrix/valos.git"
INSTALL_DIR="/opt/valos"

echo "[ValOS] 1. Mise à jour du système et installation des paquets essentiels..."
apt update && apt upgrade -y
apt install -y curl git nodejs npm xserver-xorg xinit chromium network-manager pipewire wireplumber

echo "[ValOS] 2. Activation des services réseau..."
systemctl enable NetworkManager

echo "[ValOS] 3. Clonage du dépôt ValOS dans ${INSTALL_DIR}..."
if [ -d "$INSTALL_DIR" ]; then
    echo "[ValOS] Le dossier existe déjà, mise à jour (git pull)..."
    cd "$INSTALL_DIR"
    git pull
else
    git clone "$GITHUB_REPO" "$INSTALL_DIR"
fi

echo "[ValOS] 4. Configuration du service systemd pour lancer ValOS au démarrage..."
cat << 'EOF' > /etc/systemd/system/valos.service
[Unit]
Description=ValOS Kiosk Session
After=network.target graphical.target

[Service]
User=root
WorkingDirectory=/opt/valos
ExecStart=/usr/bin/startx /usr/bin/chromium --kiosk --no-sandbox --disable-infobars http://localhost:3000/index.html
Restart=always

[Install]
WantedBy=graphical.target
EOF

systemctl enable valos.service

echo "[ValOS] Installation terminée avec succès !"
