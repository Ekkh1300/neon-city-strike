# Deployment guide

<div align="center">

[فارسی](DEPLOY.md) · **English**

</div>

The game is one file: `index.html`. Any static host will do.
For **multiplayer** you need two things: **HTTPS** (or `localhost`) and a PeerJS
signalling server.

---

## 1) Three rules you must not break

| Rule | Why |
|---|---|
| **It has to be `https://`** | WebRTC only allows connections in a secure context. On `http://` with a real domain multiplayer will not connect. (`localhost` is the exception) |
| **The signalling server must be reachable** | Browsers never talk to each other directly; they only use a broker to find each other |
| **You need TURN** | Without TURN, anyone behind a hard (symmetric) NAT — which is most mobile networks — will simply never connect |

**SOLO PLAY** needs none of this; it runs completely offline.

---

## 2) Fastest paths

### a) GitHub Pages — already live

The game is running here: **https://ekkh1300.github.io/neon-city-strike/**

To do the same for your own repo:

```bash
gh api --method POST repos/<USER>/<REPO>/pages -f "source[branch]=main" -f "source[path]=/"
```

Or in the UI: `Settings → Pages → Source: Deploy from a branch → main / (root)`

### b) Netlify Drop (no account, no build)

1. Open **https://app.netlify.com/drop**
2. Drag in the folder that contains `index.html`
3. You get a `https://xxxx.netlify.app` URL — done

### c) Vercel

```bash
npx vercel --prod
```

### d) Cloudflare Pages

`Workers & Pages → Create → Pages → Direct Upload` → upload the folder.

---

## 3) Your own server (VPS + nginx + TLS)

```bash
sudo mkdir -p /var/www/neon
sudo cp index.html /var/www/neon/
```

`/etc/nginx/sites-available/neon`:

```nginx
server {
    listen 80;
    server_name game.example.com;
    root /var/www/neon;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # one file, no build assets — don't cache so updates land instantly
    add_header Cache-Control "no-cache";
}

server {
    listen 443 ssl http2;
    server_name game.example.com;
    ssl_certificate     /etc/letsencrypt/live/game.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/game.example.com/privkey.pem;

    root /var/www/neon;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/neon /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d game.example.com      # free TLS
```

> After TLS, open the game at `https://game.example.com/`.
> A subfolder (`https://example.com/neon/`) works too — the game builds no absolute paths.

### Local test without a domain

```bash
python -m http.server 8000
# http://localhost:8000  →  multiplayer works, because localhost is a secure context
```

Testing on a phone over your LAN, `http://192.168.1.5:8000` is **not** a secure
context, so multiplayer will not connect (solo still works).

---

## 4) The PeerJS signalling server

### Default: `0.peerjs.com` (what the game uses out of the box)

The free public PeerJS server. Fine for playing with friends, but it is rate
limited, prioritises paying customers, and is explicitly built for testing. The
lobby shows which one is in use: `signal: …`.

### Recommended for a real server

**1) Run your own PeerServer:**

```bash
npm i -g peer
peerjs --port 9000 --path /peerjs --key peerjskey
```

or with Docker (no Node install):

```bash
docker run -p 9000:9000 -it -e USE_REDIS=0 peerjs/peerjs-server
```

**2) A TURN server** for players behind hard NAT — with coturn
(`/etc/turnserver.conf`):

```
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=ncs:strong-password
realm=turn.example.com
external-ip=PUBLIC_IP
```

**3) Firewall:** open `9000/tcp` (signalling) and `3478/udp` + `3478/tcp` (TURN).

### Point the game at your PeerServer — without touching the code

Every setting is available as a **URL parameter**:

```
https://game.example.com/index.html
  ?peerHost=signal.example.com
  &peerPort=443
  &peerPath=/peerjs
  &peerKey=peerjskey
  &peerSecure=1
  &turn=turn.example.com:3478
  &turnUser=ncs
  &turnPass=strong-password
```

Hand that URL to your friends. If you want a fixed URL, write once above the
`MP` block in the file:

```js
window.NCS_CONFIG = {
  host: 'signal.example.com', port: 443, path: '/peerjs',
  key: 'peerjskey', secure: true,
  turnUser: 'ncs', turnPass: 'strong-password',
  iceServers: [{ urls: 'turn:turn.example.com:3478', username: 'ncs', credential: 'strong-password' }]
};
```

### Direct room links

You can share a link that opens straight on the join screen:

```
https://game.example.com/index.html?room=ABCDE
```

---

## 5) Troubleshooting

| Message in game | Meaning | What to do |
|---|---|---|
| `signal: PeerJS cloud · 0.peerjs.com` | Default, no extra config | — |
| `signalling unreachable (…)` | The signalling server did not answer | Check `peerHost/peerPort/peerKey`; firewall |
| `room not found` | Wrong code, or the host closed the room | Ask for the code again |
| `code taken — new code, retry…` | Code collision (auto-replaced) | — |
| `no answer from the room` | The room exists but the host is unresponsive | The host must stay on the page |
| `room is full (4/4)` | Max 4 players | — |
| `host lost` / `host left the room` | Link dropped | The client reconnects once by itself |

**Connected but players are invisible** → usually a missing TURN server. Open
`chrome://webrtc-internals` in both browsers; if you only see `host candidate`
and no `relay candidate`, it is NAT and you need TURN.

**Check the browser console** for `RTC…` / `PeerError` messages.

---

## 6) Final checklist

- [ ] The game opens on `https://` (or `localhost`)
- [ ] `SOLO PLAY` works with no internet
- [ ] `MULTIPLAYER → CREATE ROOM` produces a code
- [ ] The code/link opens on a second device (ideally a phone on mobile data)
- [ ] Both players see each other and shooting works
- [ ] Signalling and TURN ports are open