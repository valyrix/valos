const http = require('http');
const { exec } = require('child_process');
const PORT = 3000;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    const url = req.url;

    if (url.startsWith('/api/audio/volume/')) {
        const vol = parseInt(url.split('/')[4], 10);
        exec(`wpctl set-volume @DEFAULT_AUDIO_SINK@ ${vol}%`, (err) => {
            res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, volume: vol }));
        });
    } else if (url === '/api/network/status') {
        exec('nmcli -t -f active,ssid dev wifi', (err, stdout) => {
            res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, output: stdout }));
        });
    } else if (url === '/api/sys/reboot') {
        exec('sudo reboot', () => {});
        res.writeHead(200); res.end(JSON.stringify({ success: true }));
    } else {
        res.writeHead(404); res.end(JSON.stringify({ error: 'Non trouvé' }));
    }
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[SysBridge Debian] Actif sur http://127.0.0.1:${PORT}`);
});
