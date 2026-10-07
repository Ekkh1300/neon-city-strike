# سرور شخصی — راهنمای کامل

<div align="center">

**فارسی** · [English](SERVER.en.md)

</div>

این پوشه (`server/`) همه‌چیز لازم برای اجرای بازی **به‌علاوه‌ی مولتی‌پلی روی سرور خودت**
را دارد. با یک دستور بالا می‌آید.

## چه چیزی بالا می‌آید

| سرویس | نقش | پورت |
|---|---|---|
| **nginx** | خودِ بازی روی HTTPS + `wss://` | 80, 443 |
| **PeerServer** | سیگنالینگ: معرفی کردن دو بازیکن به هم | 9000 (فقط داخلی) |
| **coturn** | **TURN** — چیزی که مولتی‌پلی روی اینترنت موبایل را ممکن می‌کند | 3478 |
| **certbot** | گرفتن و تمدید خودکار گواهی SSL | — |

## چرا TURN لازم است

اینترنت موبایل IP واقعی تو را پشت **NAT متقارن** پنهان می‌کند. دو گوشی در این
شبکه‌ها نمی‌توانند مستقیم به هم وصل شوند — حتی اگر هر دو در یک اپراتور باشند.
**TURN** داده‌ها را از سرور تو عبور می‌دهد و این مانع را برمی‌دارد.

روی وای‌فای خانه معمولاً بدون TURN هم وصل می‌شود؛ ولی اگر می‌خواهی **هرجا و با
هر اپراتوری** کار کند، TURN لازم است.

---

## ۱) پیش‌نیازها روی سرور

یک VPS لینوکسی (Ubuntu 22.04 یا Debian 12) با **دامنه‌ای که به IP سرور اشاره می‌کند**.

اگر Docker نداری (روی اوبیونت/دیجیتال‌اکسو):

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker "$USER" && newgrp docker
```

روی دیجیتال‌اکسو یا Hetzner از پنل خودشان هم می‌شود نصب کرد.

### دامنه

یک رکورد **A** بساز:

```
game.example.com.   A   203.0.113.42
```

صبر کن تا پاسخ بدهد:

```bash
dig +short game.example.com
```

---

## ۲) فایل‌ها را روی سرور بگذار

از پوشه‌ی `server/` در این ریپو کپی کن، یا کل ریپو را بگیر:

```bash
sudo mkdir -p /opt/neon
# روش ۱ — از گیت‌هاب
sudo git clone https://github.com/Ekkh1300/neon-city-strike.git /tmp/neon-src
sudo cp -r /tmp/neon-src/server/. /opt/neon/
# روش ۲ — یا با scp از کامپیوتر خودت:
#   scp -r server/* user@your-server:/opt/neon/

cd /opt/neon
ls   # باید باشد: setup.sh  docker-compose.yml  nginx.conf  turnserver.conf  game/
```

---

## ۳) اجرا

```bash
cd /opt/neon
sudo bash setup.sh
```

ازت **دامنه** و **ایمیل** را می‌پرسد، کلیدهای تصادفی می‌سازد، فایروال را باز می‌کند و
همه‌چیز را بالا می‌آورد. اولین گواهی SSL ممکن است یک دقیقه طول بکشد.

خروجی نهایی چیزی شبیه این است:

```
  game page        HTTP 200  ok
  signalling       ok
  TURN relay       up

  Play:  https://game.example.com/
```

**همین. لینک `https://game.example.com/` را به دوستانت بده** — بدون هیچ پارامتری.
تنظیمات داخل خود بازی ذخیره شده.

---

## ۴) تست درست

از هر سه لایه تست کن، وگرنه مطمئن نیستی TURN کار می‌کند:

```bash
cd /opt/neon

# الف) خود بازی
curl -s -o /dev/null -w '%{http_code}\n' https://game.example.com/

# ب) سیگنالینگ
docker compose exec peerjs \
  wget -qO- "http://127.0.0.1:9000/peerjs/peerjs/js/id?key=$(grep PEERJS_KEY .env | cut -d= -f2)"

# پ) TURN
docker compose logs coturn --tail=40
```

**مهم‌ترین تست:** یک گوشی را روی **اینترنت سیم‌کارت** (نه وای‌فای) باز کن، اتاق بساز و
با یک دستگاه دیگر روی شبکه‌ی متفاوت (مثلاً یکی اینترنت موبایل، یکی وای‌فای) وصل شو.

اگر `docker compose logs coturn` هنگام بازی چیزی مثل
`session ... allocated relay` نشان دهد، یعنی TURN واقعاً دارد کار می‌کند.

---

## ۵) مدیریت

```bash
cd /opt/neon

docker compose ps              # وضعیت
docker compose logs -f         # لاگ زنده
docker compose restart nginx   # ری‌استارت یک سرویس
docker compose down            # خاموش کردن
docker compose up -d           # روشن کردن
```

تنظیمات اینجا هستند:

| فایل | چه چیزی |
|---|---|
| `.env` | دامنه، ایمیل، کلیدها — **محرمانه** (`chmod 600`) |
| `nginx.conf` | HTTPS، مسیر `/peerjs` (WebSocket) |
| `turnserver.conf` | نام کاربری/رمز TURN، IP عمومی |
| `game/ncs-config.js` | تنظیماتPeerJS و TURN که بازی می‌خواند |

> `ncs-config.js` را دستی هم می‌توانی ویرایش کنی، ولی **`setup.sh` را دوباره اجرا نکن**
> مگر اینکه بخواهی همه‌چیز بازسازی شود.

---

## ۶) مشکلات رایج

| نشانه | علت | راه‌حل |
|---|---|---|
| `game.example.com does not resolve` | دکورد DNS هنوز منتشر نشده | `dig +short game.example.com` تا وقتی IP برگردد صبر کن |
| گواهی SSL صادر نمی‌شود | پورت ۸۰ بسته یا دامنه اشتباه | `docker compose logs nginx` · پورت ۸۰ باید باز باشد |
| `room not found` | کلید اشتباه یا nginx درست پروکسی نمی‌کند | `grep PEERJS_KEY .env` با مقدار داخل `ncs-config.js` مقایسه کن |
| `direct connection stuck (ICE)` | TURN کار نمی‌کند | `docker compose logs coturn` · پورت ۳۴۷۸/udp باز باشد |
| بازیکن‌ها به هم نمی‌رسند ولی هر دو وارد می‌شوند | TURN کار می‌کند ولی UDP مسدود است | در `turnserver.conf` پورت `tls-listening-port=5349` را با گواهی فعال کن |
| `permission denied` روی `.env` | دسترسی فایل | `sudo chmod 600 /opt/neon/.env` |

---

## ۷) بدون دامنه چه کنم؟

می‌توانی با **IP** هم بالا بیاوری، ولی **HTTPS لازم است** و SSL رایگان فقط با دامنه
(Let's Encrypt) صادر می‌شود.

گزینه‌ها:

- یک دامنه ارزان بخر (و برای بازی‌های دوستانه کافی است)
- از **Cloudflare Tunnel** استفاده کن — دامنه‌ی رایگان با SSL خودکار، بدون باز کردن پورت:
  ```bash
  cloudflared tunnel --url http://localhost:80
  ```
  (TURN همچنان روی پورت ۳۴۷۸ لازم است و باید باز باشد)
