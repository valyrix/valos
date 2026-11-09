const http = require('http');
const { exec } = require('child_process');
const PORT = 3000;

const server = http.createServer((req, res) => {
    // En-têtes CORS pour autoriser l'interface web locale
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { 
        res.writeHead(204); 
        res.end(); 
        return; 
    }

    const url = req.url;
    console.log(`[SysBridge Debian] Requête reçue : ${req.method} ${url}`);

    // --- 1. AUDIO : Gestion du volume via PipeWire / wpctl ---
    if (url.startsWith('/api/audio/volume/')) {
        const vol = parseInt(url.split('/')[4], 10);
        if (isNaN(vol) || vol < 0 || vol > 100) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Volume invalide (0-100)' }));
            return;
        }

        exec(`wpctl set-volume @DEFAULT_AUDIO_SINK@ ${vol}%`, (err) => {
            res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, volume: vol }));
        });
    }

    // --- 2. RÉSEAU : Statut Wi-Fi via NetworkManager / nmcli ---
    else if (url === '/api/network/status') {
        exec('nmcli -t -f active,ssid dev wifi', (err, stdout) => {
            res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, output: stdout }));
        });
    }

    // --- 3. SYSTÈME : Mise à jour via update.sh ---
    else if (url === '/api/sys/update') {
        exec('/opt/valos/update.sh', (err, stdout) => {
            res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: !err, 
                message: err ? 'Erreur lors de la mise à jour' : 'Mise à jour effectuée avec succès !', 
                output: stdout 
            }));
        });
    }

    // --- 4. SYSTÈME : Redémarrage ---
    else if (url === '/api/sys/reboot') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Redémarrage en cours...' }));
        setTimeout(() => { exec('sudo reboot', () => {}); }, 500);
    }

    // --- 5. SYSTÈME : Extinction ---
    else if (url === '/api/sys/shutdown') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Extinction en cours...' }));
        setTimeout(() => { exec('sudo poweroff', () => {}); }, 500);
    }

    // --- ERREUR 404 ---
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint non trouvé' }));
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[SysBridge Debian] Actif et à l'écoute sur http://127.0.0.1:${PORT}`);
});
