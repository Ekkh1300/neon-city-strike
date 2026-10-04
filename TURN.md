# مولتی‌پلی روی شبکه‌ی موبایل (TURN) — با Docker

<div align="center">

**فارسی** · [English](DEPLOY.en.md)

</div>

## چرا لازم است

بازی فقط یک فایل است و **سیگنالینگ** (پیدا کردن همدیگر) را `0.peerjs.com` انجام می‌دهد.
اما **اتصال مستقیم** بین دو گوشی از وسط اینترنت رد نمی‌شود؛ به کمک **TURN** رد می‌شود
(یعنی داده‌ها از سرور شما ترنل می‌شوند).

اگر بازیکن‌ها روی **اینترنت موبایل** (همراه اول، ایرانسل، اکراتل…) باشند، شبکه‌ی آن‌ها
معمولاً **NAT متقارن** است و بدون TURN اتصال **هرگز** برقرار نمی‌شود.
روی وای‌فای خانه معمولاً بدون TURN هم کار می‌کند.

نشانه‌اش در بازی: پیام
`could not open a direct connection ... a TURN server is required`

---

## اجرا در ۳ دقیقه (روی یک سرور مجازی)

نیاز: یک VPS (اوبیونت/هetchی/آروان…) با **دامنه** و **پورت‌های باز**، و Docker.

### ۱) فایل‌ها را بساز

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
# no UDP relay (TLS) needs a cert; plain UDP is enough for most cases
fingerprint
lt-cred-mech
user=ncs:RANDOM_TURN_PASSWORD
realm=turn.example.com
external-ip=PUT_YOUR_PUBLIC_IP_HERE
```

### ۲) با Docker Compose بالا بیاور

`docker-compose.yml`:
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

### ۳) فایروال

```bash
sudo ufw allow 9000/tcp     # PeerJS signalling (ws)
sudo ufw allow 3478/udp     # TURN over UDP
sudo ufw allow 3478/tcp     # TURN over TCP
sudo ufw allow 5349/tcp     # TURN over TLS (optional)
```

### ۴) تست کن که PeerServer بالاست

```bash
curl -i http://127.0.0.1:9000/peerjs/js/id?key=CHANGE_ME_TO_A_RANDOM_SECRET
# باید JSON برگرداند؛ یعنی سیگنالینگ سالم است
```

### ۵) لینک بازی را بساز

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

- `peerSecure=1` یعنی `wss://` — **حتماً** اگر پشت nginx با TLS هستی
- `&room=CODE` هم می‌توانی اضافه کنی تا مستقیم صفحه‌ی پیوستن باز شود
- آدرس بالا را به دوستانت بده. همه با همین آدرس بازی می‌کنند.

> `peerHost` باید دامنه‌ی سرور **خودت** باشد (مثلاً `signal.your-domain.com`)، نه
> `0.peerjs.com`. برای دامنه TURN هم می‌توانی از IP استفاده کنی:
> `&turn=YOUR_SERVER_IP:3478`

### ۶) (اختیاری) nginx برای wss

اگر می‌خواهی PeerJS روی دامنه‌ی خودت و پشت nginx باشد:

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
        proxy_read_timeout 86400s;   # WebSocket طولانی
    }
}
```

```bash
sudo certbot --nginx -d signal.your-domain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## بدون سرور چه کاری می‌شود کرد؟

| راه | نتیجه |
|---|---|
| فقط GitHub Pages | روی **وای‌فای خانه** معمولاً کار می‌کند، روی **موبایل** اغلب نه |
| یک TURN عمومی رایگان | برای تست ممکن است، ولی پایدار نیست و به کسی دیگر وابسته‌ای |
| **TURN خودت** | **درست و پایدار** — همین راهنما |

اگر VPS نداری و فقط می‌خواهی با یک دوست روی **وای‌فای خانه** بازی کنی، همان
GitHub Pages کافی است — کد را بفرست و بازی کنید.