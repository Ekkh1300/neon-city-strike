# TURN for mobile networks — with Docker

<div align="center">

[فارسی](TURN.md) · **English**

</div>

## Why this exists

The game is a single file and uses `0.peerjs.com` for **signalling** (finding each
other). But the **direct connection** between two phones does not cross the open
internet — that needs a **TURN relay** (traffic goes through your server).

Players on **mobile data** (any carrier, CGNAT/symmetric NAT) can never connect
without TURN. Home WiFi usually works without it.

The game tells you when this is the problem:
`could not open a direct connection ... a TURN server is required`

---

## Running it in 3 minutes (on any VPS)

You need: a VPS with a **domain**, **open ports**, and Docker.

### 1) Files

```bash
mkdir -p ~/neon-turn && cd ~/neon-turn
```

`peerjs.json`:
```json
{
  "port": 9000,
  "path": "/peerjs",
  "key": "CHANGE_ME_TO_A_RANDOM_SECRET"
}
```

`turnserver.conf`:
```
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=ncs:RANDOM_TURN_PASSWORD
realm=turn.example.com
external-ip=PUT_YOUR_PUBLIC_IP_HERE
```

### 2) docker-compose.yml

```yaml
services:
  peerjs:
    image: peerjs/peerjs-server:latest
    container_name: neon-peerjs
    restart: unless-stopped
    command: --port 9000 --path /peerjs --key ${PEERJS_KEY}
    ports:
      - "9000:9000"

  coturn:
    image: coturn/coturn:latest
    container_name: neon-coturn
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./turnserver.conf:/etc/coturn/turnserver.conf:ro
    command: -c /etc/coturn/turnserver.conf --log-file=stdout
```

`.env`:
```
PEERJS_KEY=CHANGE_ME_TO_A_RANDOM_SECRET
```

```bash
docker compose up -d
```

### 3) Firewall

```bash
sudo ufw allow 9000/tcp     # PeerJS signalling (ws)
sudo ufw allow 3478/udp     # TURN over UDP
sudo ufw allow 3478/tcp     # TURN over TCP
sudo ufw allow 5349/tcp     # TURN over TLS (optional)
```

### 4) Check signalling works

```bash
curl -i http://127.0.0.1:9000/peerjs/js/id?key=CHANGE_ME_TO_A_RANDOM_SECRET
# JSON back = signalling is alive
```

### 5) Build the game link

```
https://ekkh1300.github.io/neon-city-strike/index.html
  ?peerHost=signal.your-domain.com
  &peerPort=443
  &peerSecure=1
  &peerKey=CHANGE_ME_TO_A_RANDOM_SECRET
  &turn=turn.your-domain.com:3478
  &turnUser=ncs
  &turnPass=RANDOM_TURN_PASSWORD
```

- `peerSecure=1` means `wss://` — required behind TLS/nginx
- add `&room=CODE` to drop friends straight on the join screen
- `peerHost` must be **your own** domain, not `0.peerjs.com`; `turn` accepts a raw IP too

### 6) (Optional) nginx in front of PeerJS

```nginx
server {
    listen 443 ssl http2;
    server_name signal.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/signal.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signal.your-domain.com/privkey.pem;

    location /peerjs {
        proxy_pass http://127.0.0.1:9000/peerjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;   # long-lived WebSocket
    }
}
```

```bash
sudo certbot --nginx -d signal.your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## No server?

| Option | Result |
|---|---|
| GitHub Pages only | fine on **home WiFi**, often broken on **mobile data** |
| A free public TURN | works for a quick test, but unreliable and someone else's server |
| **Your own TURN** | **correct and stable** — this guide |