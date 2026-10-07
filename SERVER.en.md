# Your own server — full guide

<div align="center">

[فارسی](SERVER.md) · **English**

</div>

This folder (`server/`) has everything needed to run the game **plus working
multiplayer on your own server**, with one command.

## What comes up

| Service | Role | Port |
|---|---|---|
| **nginx** | the game over HTTPS + `wss://` | 80, 443 |
| **PeerServer** | signalling: introduces the two players | 9000 (internal only) |
| **coturn** | **TURN** — what makes multiplayer work on mobile data | 3478 |
| **certbot** | obtains and renews the TLS certificate automatically | — |

## Why TURN is required

Mobile networks hide your real IP behind **symmetric NAT**. Two phones on those
networks cannot connect directly — even on the same carrier. **TURN** relays the
traffic through your server and removes that obstacle.

Home WiFi usually connects without TURN, but if you want it to work **anywhere, on
any carrier**, TURN is the piece that matters.

---

## 1) Server prerequisites

A Linux VPS (Ubuntu 22.04 or Debian 12) with a **domain pointing at its IP**.

No Docker? (on Ubuntu/DigitalOcean):

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker "$USER" && newgrp docker
```

### Domain

Create an **A** record:

```
game.example.com.   A   203.0.113.42
```

Wait for it to resolve:

```bash
dig +short game.example.com
```

---

## 2) Put the files on the server

```bash
sudo mkdir -p /opt/neon
# from GitHub
sudo git clone https://github.com/Ekkh1300/neon-city-strike.git /tmp/neon-src
sudo cp -r /tmp/neon-src/server/. /opt/neon/
# or scp the server/ folder from your machine:
#   scp -r server/* user@your-server:/opt/neon/

cd /opt/neon
ls   # should show: setup.sh  docker-compose.yml  nginx.conf  turnserver.conf  game/
```

---

## 3) Run it

```bash
cd /opt/neon
sudo bash setup.sh
```

It asks for your **domain** and **email**, generates random secrets, opens the
firewall and starts everything. The first certificate can take a minute.

The final output looks like this:

```
  game page        HTTP 200  ok
  signalling       ok
  TURN relay       up

  Play:  https://game.example.com/
```

**That's it. Share `https://game.example.com/` with friends** — no parameters. The
settings live inside the game itself.

---

## 4) Test properly

Check all three layers, otherwise you don't actually know TURN works:

```bash
cd /opt/neon

# a) the game
curl -s -o /dev/null -w '%{http_code}\n' https://game.example.com/

# b) signalling
docker compose exec peerjs \
  wget -qO- "http://127.0.0.1:9000/peerjs/peerjs/js/id?key=$(grep PEERJS_KEY .env | cut -d= -f2)"

# c) TURN
docker compose logs coturn --tail=40
```

**The test that counts:** open the game on a phone over **mobile data** (not WiFi),
create a room, and join from a device on a *different* network (one on cellular,
one on WiFi).

If `docker compose logs coturn` shows something like
`session ... allocated relay` while you play, TURN is genuinely working.

---

## 5) Operating it

```bash
cd /opt/neon

docker compose ps              # status
docker compose logs -f         # live logs
docker compose restart nginx   # restart one service
docker compose down            # stop
docker compose up -d           # start
```

Settings live in:

| File | What |
|---|---|
| `.env` | domain, email, keys — **secret** (`chmod 600`) |
| `nginx.conf` | HTTPS, the `/peerjs` WebSocket route |
| `turnserver.conf` | TURN user/password, public IP |
| `game/ncs-config.js` | the PeerJS + TURN config the game reads |

> You can edit `ncs-config.js` by hand, but **don't re-run `setup.sh`** unless you
> want everything regenerated.

---

## 6) Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `game.example.com does not resolve` | DNS not propagated yet | `dig +short game.example.com` until it returns the IP |
| TLS never issued | port 80 closed, or wrong domain | `docker compose logs nginx` · port 80 must be open |
| `room not found` | wrong key, or nginx not proxying | compare `grep PEERJS_KEY .env` with the value inside `ncs-config.js` |
| `direct connection stuck (ICE)` | TURN not working | `docker compose logs coturn` · port 3478/udp must be open |
| Both players join but can't reach each other | TURN up, UDP blocked | enable `tls-listening-port=5349` with a certificate in `turnserver.conf` |
| `permission denied` on `.env` | file ownership | `sudo chmod 600 /opt/neon/.env` |

---

## 7) No domain?

You *can* run on a raw IP, but **HTTPS is mandatory** and free certificates only
work with a domain (Let's Encrypt).

Options:

- Buy a cheap domain (plenty for playing with friends)
- Use a **Cloudflare Tunnel** — free domain with automatic TLS, no open ports:
  ```bash
  cloudflared tunnel --url http://localhost:80
  ```
  (TURN still needs port 3478 open)
