# راهنمای انتشار روی سرور

<div align="center">

**فارسی** · [English](DEPLOY.en.md)

</div>

بازی یک فایل است: `index.html`. هر هاست استاتیکی کافی است.
تنها چیزی که برای **مولتی‌پلی** لازم دارید: **HTTPS** (یا `localhost`) و یک سرور
سیگنالینگ PeerJS.

---

## ۱) سه قانون که نباید بشکنید

| قانون | چرا |
|---|---|
| **باید `https://` باشد** | WebRTC فقط در بستر امن اجازه‌ی اتصال می‌دهد. روی `http://` با دامنه‌ی واقعی مولتی‌پلی نمی‌کارد. (`localhost` استثناست) |
| **سرور سیگنالینگ باید در دسترس باشد** | مرورگرها مستقیم به هم وصل نمی‌شوند؛ فقط برای «پیدا کردن همدیگر» از یک سرور واسط کمک می‌گیرند |
| **TURN لازم است** | بدون TURN، هر بازیکنی که پشت NAT سخت (متقارن) باشد — یعنی بیشتر اینترنت موبایل — هرگز وصل نمی‌شود |

حالت **تک‌نفری (SOLO PLAY)** هیچ‌کدام از این‌ها را نمی‌خواهد؛ کاملاً آفلاین اجرا می‌شود.

---

## ۲) سریع‌ترین راه‌ها

### الف) GitHub Pages — همین الان فعال است

بازی اینجا زنده است: **https://ekkh1300.github.io/neon-city-strike/**

اگر می‌خواهید همین روش را برای ریپوی خودتان انجام دهید:

```bash
gh api --method POST repos/<USER>/<REPO>/pages -f "source[branch]=main" -f "source[path]=/"
```

یا از رابط: `Settings → Pages → Source: Deploy from a branch → main / (root)`

### ب) Netlify Drop (بدون حساب، بدون ساخت)

۱. وارد **https://app.netlify.com/drop** شوید
۲. پوشه‌ای که `index.html` داخلش است بکشید و رها کنید
۳. یک آدرس `https://xxxx.netlify.app` می‌گیرید — تمام

### ج) Vercel

```bash
npx vercel --prod
```

### د) Cloudflare Pages

`Workers & Pages → Create → Pages → Direct Upload` → پوشه را آپلود کنید.

---

## ۳) سرور خودتان (VPS + nginx + TLS)

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

    # the game is one file; no caching games so updates land instantly
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
sudo certbot --nginx -d game.example.com      # TLS رایگان
```

> بعد از گرفتن TLS، بازی را روی `https://game.example.com/` باز کنید.
> اگر زیرپوشه اجرا می‌کنید (`https://example.com/neon/`) همه‌چیز کار می‌کند، چون
> بازی هیچ مسیر مطلقی نمی‌سازد.

### تست محلی بدون دامنه

```bash
python -m http.server 8000
# http://localhost:8000  →  مولتی‌پلی کار می‌کند، چون localhost بستر امن محسوب می‌شود
```

برای تست موبایل در شبکه‌ی محلی، IP دیگری مثل `http://192.168.1.5:8000` **بستر امن نیست**
و مولتی‌پلی وصل نمی‌شود (فقط تک‌نفری).

---

## ۴) سرور سیگنالینگ PeerJS

### پیش‌فرض: `0.peerjs.com` (همین الان استفاده می‌شود)

سرور رایگان و عمومی PeerJS. برای بازی دوستانه کافی است، ولی محدودیت دارد
(سقف اتصال، اولویت با مشتری‌های تجاری، و «برای تست» طراحی شده). آدرس آن در صفحه‌ی لابی
نوشته می‌شود: `signal: …`.

### توصیه‌شده برای سرور واقعی

**۱) خود PeerServer:**

```bash
npm i -g peer
peerjs --port 9000 --path /peerjs --key peerjskey
```

یا با Docker (بدون نصب Node):

```bash
docker run -p 9000:9000 -it -e USE_REDIS=0 peerjs/peerjs-server
```

**۲) یک TURN برای کسانی که پشت NAT سخت هستند** — با coturn
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

**۳) فایروال:** `9000/tcp` (سیگنالینگ) و `3478/udp` و `3478/tcp` (TURN) باز باشد.

### وصل کردن بازی به PeerServer خودتان — بدون دست‌زدن به کد

همه‌ی تنظیمات از طریق **پارامترهای آدرس** پشتیبانی می‌شوند:

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

می‌توانید همین را در آدرس به دوستانتان بدهید. اگر آدرس ثابت می‌خواهید، یک‌بار بالای
بخش `MP` در فایل بنویسید:

```js
window.NCS_CONFIG = {
  host: 'signal.example.com', port: 443, path: '/peerjs',
  key: 'peerjskey', secure: true,
  turnUser: 'ncs', turnPass: 'strong-password',
  iceServers: [{ urls: 'turn:turn.example.com:3478', username: 'ncs', credential: 'strong-password' }]
};
```

### لینک مستقیم اتاق

می‌توانید لینکی بدهید که مستقیم داخل صفحه‌ی پیوستن باز شود:

```
https://game.example.com/index.html?room=ABCDE
```

---

## ۵) عیب‌یابی

| پیام داخل بازی | معنی | چه کار کنید |
|---|---|---|
| `signal: PeerJS cloud · 0.peerjs.com` | حالت پیش‌فرض، بدون تنظیم اضافه | — |
| `signalling unreachable (…)` | سرور سیگنالینگ جواب نداد | `peerHost/peerPort/peerKey` را چک کنید؛ فایروال |
| `room not found` | کد اشتباه است یا میزبان اتاق را بست | کد را دوباره بفرستید |
| `code taken — new code, retry…` | تداخل کد (خودکار عوض می‌شود) | — |
| `no answer from the room` | اتاق وجود دارد ولی میزبان گوش نمی‌دهد | میزبان باید باز بماند |
| `room is full (4/4)` | حداکثر ۴ بازیکن | — |
| `host lost` / `host left the room` | ارتباط قطع شد | بازی خودکار یک‌بار وصل می‌شود |

**اتصال برقرار می‌شود ولی بازیکن‌ها همدیگر را نمی‌بینند** → معمولاً TURN ندارید.
آدرس `chrome://webrtc-internals` را در هر دو مرورگر باز کنید؛ اگر فقط
`host candidate` دارید و `relay candidate` ندارید، مشکل از NAT است و TURN لازم دارید.

**کنسول مرورگر را چک کنید**: خطاهای WebRTC با پیشوند `RTC` یا
`PeerError` دیده می‌شوند.

---

## ۶) چک‌لیست نهایی

- [ ] بازی روی `https://` باز می‌شود (یا `localhost`)
- [ ] `SOLO PLAY` بدون اینترنت کار می‌کند
- [ ] `MULTIPLAYER → CREATE ROOM` کد می‌دهد
- [ ] لینک/کد روی یک دستگاه دیگر (ترجیحاً موبایل با اینترنت موبایل) باز می‌شود
- [ ] هر دو بازیکن همدیگر را در صحنه می‌بینند و تیراندازی کار می‌کند
- [ ] پورت‌های سیگنالینگ و TURN باز هستند