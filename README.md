# NEON CITY STRIKE

<div align="center">

**فارسی** · [English](README.en.md)

![three.js](https://img.shields.io/badge/three.js-r186-000000?style=flat-square&logo=three.js&logoColor=white)
![PeerJS](https://img.shields.io/badge/multiplayer-PeerJS-00eaff?style=flat-square)
![HTML5](https://img.shields.io/badge/HTML5-game-e34af26?style=flat-square&logo=html5&logoColor=white)
![Offline](https://img.shields.io/badge/offline-ready-00ffa3?style=flat-square)
![Mobile](https://img.shields.io/badge/touch%20controls-ff2fd6?style=flat-square)

![NEON CITY STRIKE — منوی بازی](preview.png)

</div>

یک **بازی سایترپانک آره‌نا شوتر** که کاملاً در **یک فایل HTML** جا شده است — بدون نصب،
بدون سرور، بدون اینترنت. کل بازی (شامل موتور three.js و کتابخانه‌ی شبکه‌ی PeerJS) داخل خود
فایل جاسازی شده و هیچ درخواستی به بیرون نمی‌رود.

---

## اجرا

فایل [`index.html`](index.html) را **دابل‌کلیک** کنید — همین. نیازی به نصب، سرور یا اینترنت نیست.

اگر می‌خواهید **بخش چندنفره (Multiplayer)** را تست کنید، بهتر است فایل را از طریق یک
آدرس `https://` یا `localhost` سرو کنید، چون WebRTC در محیط‌های ناامن محدود می‌شود:

```bash
python -m http.server 8000
# سپس در مرورگر: http://localhost:8000
```

---

## امکانات

- **موج‌های بی‌پایان** — هر موج سخت‌تر، با شمارش معکوس و فشار ریتمیک
- **چهار سلاح** با آمار واقعی (آسیب، خشاب، سرعت آتش، پراکندگی، لگد، بُرد، زوم در حالت ADS):

  | سلاح | آسیب | خشاب | فاصله | حس مناسب |
  |---|---|---|---|---|
  | `VIPER .45` | 34 | 12 | 120 | تیراندازی دقیق و کم‌هزینه |
  | `HORNET SMG` | 14 | 32 | 80 | آتش پیوسته، کنترل جمعیت |
  | `JUDGE-12` | 11 × ۸ | 6 | 35 | یک‌شات نزدیک، لگد سنگین |
  | `LONGSHOT-50` | 110 | 5 | 250 | تک‌تیرکشی از راه دور، زوم ۲۴ درجه |

- **دو حالت بازی** — `SOLO PLAY` تک‌نفره و `MULTIPLAYER` با ساخت/پیوست اتاق (Room Code)
- **حرکت کامل سیمولیشن‌شده** — دویدن با **استقامت** (Stamina)، **پرش**، **اسلاید** (Slide)
- **HUD تاکتیکی** — جان، استقامت، مهمات و ذخیره، نوار بارگذاری، هیت‌مارکر، کراس‌هیر پویا
- **انتخاب سلاح** در هر تولد دوباره (`CHOOSE YOUR WEAPON`)، امتیاز، زمان، کیل و مرگ
- **کنترل موبایل** — جوی‌استیک چپ برای حرکت، کشیدن سمت راست برای نگاه/تیر، دکمه‌های لمسی
- **قدرت‌گیری تطبیقی** — پیام «چرخشگر دستگاه را بچرخان» برای موبایل، توقف در `ESC`

---

## کنترل‌ها

| کلید | کار |
|---|---|
| `W A S D` | حرکت |
| `MOUSE` | نشانه‌گیری |
| `LMB` | شلیک |
| `RMB` | نشانه‌گیری دقیق (ADS) |
| `R` | بارگذاری مجدد |
| `SPACE` | پرش |
| `SHIFT` | دویدن (مصرف استقامت) |
| `CTRL` | اسلاید |
| `ESC` | مکث |

**موبایل:** جوی‌استیک چپ = حرکت · کشیدن سمت راست = چرخش دید · دکمه‌های `FIRE` / `ADS` / `RELOAD` / `RUN` / `SLIDE` / `JUMP`

---

## ساختار

```
index.html   کل بازی: HTML + CSS + JS + three.js + PeerJS (همه درون یک فایل، ~815KB)
preview.png  تصویر منو
```

## نکته‌ها

- برای موبایل قابل اجرا روی مرورگر است و حالت تمام‌صفحه (`mobile-web-app-capable`) دارد
- بخش چندنفره از **PeerJS Cloud** استفاده می‌کند، پس برای آن اینترنت لازم است
- نام فایل اصلی روی سیستم شما «neon-city-strike (7).html» بود؛ اینجا به `index.html`
  تغییر نام داده شده تا ریپو و GitHub Pages تمیز باشند