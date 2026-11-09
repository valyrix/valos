#!/bin/bash
set -e

echo "[ValOS] Installation du système..."
apt update && apt upgrade -y
apt install -y curl git nodejs npm xserver-xorg xinit chromium network-manager pipewire wireplumber

systemctl enable NetworkManager

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
echo "[ValOS] Installation terminée. Redémarrez la machine."
