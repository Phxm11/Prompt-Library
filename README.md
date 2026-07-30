<div align="center">

# 🎨 Prompt Library

**คลัง Prompt AI ภาษาไทย — ค้นหา คัดลอก แล้วเอาไปใช้ได้ทันที**

Next.js 16 · React 19 · Supabase · Tailwind CSS 4 · TypeScript

**[🇹🇭 ภาษาไทย](#-ภาษาไทย) · [🇬🇧 English](#-english)**

</div>

---

# 🇹🇭 ภาษาไทย

> อ่านเวอร์ชันภาษาอังกฤษได้ที่ [English](#-english)

## สารบัญ

- [ภาพรวม](#ภาพรวม)
- [ฟีเจอร์](#ฟีเจอร์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [เริ่มต้นใช้งาน](#เริ่มต้นใช้งาน)
- [ตัวแปรสภาพแวดล้อม](#ตัวแปรสภาพแวดล้อม)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ระบบหลังบ้าน](#ระบบหลังบ้าน)
- [แนวทางการเขียนโค้ด](#แนวทางการเขียนโค้ด)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)

## ภาพรวม

เว็บรวม prompt สำหรับใช้กับ AI สร้างรูปภาพ วิดีโอ และงานนำเสนอ ผู้ใช้ค้นหา prompt ที่ต้องการ กดคัดลอกไปวางใน AI ที่ใช้อยู่ได้ทันที หรือสมัครเข้ามาเพื่อโพสต์ prompt ของตัวเอง เขียนรีวิว และเก็บรายการโปรด

จุดที่ตั้งใจทำเป็นพิเศษ:

- **รองรับภาษาไทยจริงจัง** — การนับตัวอักษรใช้ grapheme ไม่ใช่ code unit ("น้ำใจ" นับ 3 ไม่ใช่ 5), การค้นหาจับคำบางส่วนได้แม้ไม่มีเว้นวรรค
- **กติกาบังคับที่ฐานข้อมูล** — ตัวกรองคำหยาบ ระบบแบน และกติกาเปลี่ยนชื่อผู้ใช้ ทำเป็น trigger/RLS ไม่ใช่เช็คแค่ในหน้าเว็บ เพราะหน้าเว็บคุยกับ Supabase ตรง ๆ ใครยิง API เองก็ข้ามได้
- **ธีมสว่าง/มืด** ใช้ token สีชุดเดียว เปลี่ยนที่เดียวทั้งเว็บ

## ฟีเจอร์

### สำหรับผู้ใช้ทั่วไป

| ฟีเจอร์ | รายละเอียด |
| --- | --- |
| 🔍 **ค้นหา** | ค้นจากชื่อ คำอธิบาย และเนื้อ prompt แบบจับคำบางส่วน พร้อมรายการแนะนำที่มีทั้ง prompt และผู้ใช้ |
| 📋 **คัดลอก** | กดปุ่มเดียวได้ prompt เต็ม ๆ **ไม่ต้องล็อกอิน** ยอดคัดลอกนับเป็น "จำนวนคน" ไม่ใช่จำนวนครั้ง |
| ❤️ **รายการโปรด** | บันทึก prompt ที่ชอบไว้กลับมาดูภายหลัง |
| ⭐ **รีวิว** | ให้คะแนน 1–5 ดาว เขียนคอมเมนต์ เลือกแสดงตัวตนหรือไม่ระบุตัวตนก็ได้ ผู้เยี่ยมชมที่ไม่ล็อกอินก็รีวิวได้ |
| 🗂️ **หมวดหมู่ / ประเภทสื่อ / โมเดล AI** | กรอง prompt ได้หลายมิติ |
| 👥 **ผู้เยี่ยมชม (guest)** | ไม่ต้องสมัครก็ดู ค้นหา คัดลอก (นับยอดให้ด้วย) และรีวิวได้ |
| 👤 **โปรไฟล์** | ตั้งรูป (ครอปเองได้) ชื่อเล่น ไบโอ และเปลี่ยน username ได้ทุก 14 วัน |
| 🌐 **โปรไฟล์สาธารณะ** | `/u/[username]` ดู prompt ของผู้ใช้คนอื่นได้ ไม่แสดงอีเมล |
| 🌗 **ธีมสว่าง/มืด** | จำค่าไว้ในเครื่อง |

### สำหรับแอดมิน

| ฟีเจอร์ | รายละเอียด |
| --- | --- |
| 📊 **แดชบอร์ด** | สรุปจำนวน prompt ผู้ใช้ และรีวิว |
| 📝 **จัดการ prompt** | ค้นหา กรองตามหมวดหมู่/สถานะ ลบได้ |
| 👥 **จัดการผู้ใช้** | เปลี่ยนสิทธิ์ แบน/ปลดแบน กรองตามสิทธิ์และสถานะ |
| 💬 **จัดการรีวิว** | กรองตามคะแนนและประเภทผู้รีวิว ค้นหาจากข้อความหรือชื่อ prompt |
| 🚫 **ระบบแบน** | เลือก 1–3650 วัน หรือถาวร พร้อมเหตุผลที่ผู้ใช้จะเห็น หมดกำหนดแล้วปลดอัตโนมัติ |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| ภาษา | TypeScript 5 |
| ฐานข้อมูล | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google, Facebook OAuth) |
| ORM / Schema | Prisma 7 (ใช้เป็นตัวจัดการ schema เป็นหลัก) |
| ฟอนต์ | Prompt (ไทย+ละติน), JetBrains Mono (ตัวเลข/อังกฤษ) |

> ⚠️ **Next.js เวอร์ชันนี้มี breaking changes** จากที่คุ้นเคย ก่อนเขียนโค้ดควรอ่านคู่มือใน `node_modules/next/dist/docs/` ตามที่ระบุไว้ใน `AGENTS.md`

## เริ่มต้นใช้งาน

### สิ่งที่ต้องมี

- Node.js 20 ขึ้นไป
- โปรเจกต์ Supabase (แพ็กเกจฟรีก็พอ)

### ขั้นตอน

```bash
# 1. ติดตั้ง dependencies (postinstall จะรัน prisma generate ให้เอง)
npm install

# 2. สร้างไฟล์ .env.local แล้วใส่ค่าตามหัวข้อถัดไป

# 3. รัน SQL ในโฟลเดอร์ prisma/sql/ ตามลำดับ (ดูหัวข้อ "ฐานข้อมูล")

# 4. เริ่ม dev server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## ตัวแปรสภาพแวดล้อม

สร้างไฟล์ `.env.local` ที่รากโปรเจกต์:

```bash
# จาก Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# จาก Project Settings → Database → Connection string
# pooled (พอร์ต 6543) ใช้ตอนแอปรันจริง
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres
# direct (พอร์ต 5432) ใช้กับคำสั่ง Prisma CLI
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:5432/postgres
```

> โปรเจกต์นี้เก็บ env ไว้ที่ `.env.local` ไฟล์เดียว ส่วน Prisma ปกติอ่านแค่ `.env` จึงมี `prisma.config.ts` สั่งโหลด `.env.local` เพิ่มให้

## ฐานข้อมูล

Schema อยู่ใน `prisma/schema.prisma` (introspect มาจาก Supabase ด้วย `npm run prisma:pull`)

### ตารางหลัก

| ตาราง | หน้าที่ |
| --- | --- |
| `profiles` | โปรไฟล์ผู้ใช้ ผูกกับ `auth.users` เก็บ username, ชื่อเล่น, รูป, ไบโอ, สิทธิ์, สถานะแบน |
| `prompts` | ตัว prompt พร้อมรูปปก ยอดชม ยอดถูกใจ ยอดคัดลอก |
| `categories` / `media_types` / `ai_models` | ข้อมูลอ้างอิงสำหรับกรอง |
| `reviews` | รีวิวและคะแนน รองรับทั้งสมาชิกและผู้เยี่ยมชม |
| `favorites` | รายการโปรด |
| `prompt_copies` | ใครเคยคัดลอก prompt ไหน ใช้กันนับซ้ำอย่างเดียว — สมาชิกยึด `user_id` ผู้เยี่ยมชมยึด `guest_id` |
| `prompt_examples` / `prompt_tags` / `prompt_ai_models` | ตารางเชื่อมของ prompt |
| `profanity_words` | ลิสต์คำต้องห้าม sync มาจาก `lib/profanity.ts` |

### ไฟล์ SQL

รันตามลำดับใน Supabase SQL Editor (หรือผ่าน `psql`):

| ไฟล์ | ทำอะไร |
| --- | --- |
| `add-cover-position.sql` | ตำแหน่งครอปรูปปก |
| `add-image-crop.sql` | การซูมรูปปก |
| `add-review-anonymous.sql` | รีวิวแบบไม่ระบุตัวตน |
| `copy-count-per-user.sql` | เปลี่ยนยอดคัดลอกเป็นนับจำนวนคน |
| `remove-usage-history.sql` | ถอดระบบประวัติการใช้งาน + สร้าง `prompt_copies` |
| `fix-prompt-copies-pk.sql` | แก้ primary key ของ `prompt_copies` (ดูหมายเหตุด้านล่าง) |
| `add-profile-bio.sql` | เพิ่มไบโอ |
| `add-username-change-rule.sql` | กติกาเปลี่ยน username ทุก 14 วัน |
| `add-profanity-guard.sql` | ตัวกรองคำหยาบระดับฐานข้อมูล |
| `add-ban-enforcement.sql` | ระบบแบนที่บังคับใช้จริง |
| `add-guest-copy-count.sql` | ให้ผู้เยี่ยมชมที่ไม่ได้ล็อกอินคัดลอกแล้วนับยอดได้ |

> 💡 **บทเรียนจาก `fix-prompt-copies-pk.sql`** — ตอนแรกตั้ง primary key เป็น `(user_id, prompt_id)` ซึ่งเข้าเงื่อนไขที่ PostgREST ใช้เดาความสัมพันธ์ many-to-many อัตโนมัติ ทำให้ `prompts` กับ `profiles` มีเส้นทางเชื่อมสองทาง แล้ว query ที่ embed `profiles(...)` พังทั้งเว็บด้วย `PGRST201` — ตารางเชื่อมในโปรเจกต์นี้จึงต้องมี primary key ของตัวเองเสมอ แล้วกันซ้ำด้วย `unique` แทน

## โครงสร้างโปรเจกต์

```
app/
├── page.tsx               # หน้าแรก (hero + prompt แนะนำ)
├── home/                  # หน้ารายการ prompt ทั้งหมด
├── search/                # ผลการค้นหา
├── popular/               # จัดอันดับยอดนิยม
├── favorites/             # รายการโปรด
├── profile/               # โปรไฟล์ของฉัน
├── u/[username]/          # โปรไฟล์สาธารณะของคนอื่น
├── prompts/
│   ├── [id]/              # รายละเอียด prompt + รีวิว
│   └── new/               # ฟอร์มเพิ่ม/แก้ prompt
├── media-types/, ai-models/
├── login/, auth/callback/ # OAuth
├── admin/                 # หลังบ้าน (prompts / users / reviews)
└── components/            # component ที่ใช้ร่วมกันทั้งเว็บ

lib/
├── supabase/              # client ฝั่ง browser และ server
├── profanity.ts           # ตัวกรองคำหยาบ (ลิสต์คำอยู่ที่นี่ที่เดียว)
├── promptSearch.ts        # เงื่อนไขค้นหา ใช้ร่วมกันทุกที่
├── recordCopy.ts          # กติกานับยอดคัดลอก (สมาชิก + ผู้เยี่ยมชม)
├── guestId.ts             # id ประจำเบราว์เซอร์ของผู้เยี่ยมชม ใช้กันนับซ้ำ
├── profileCache.ts        # จำโปรไฟล์ไว้กันรูปกระพริบตอนรีเฟรช
├── localAvatar.ts         # รูปโปรไฟล์สำรองในเครื่อง
├── prepareImageUpload.ts
└── prisma.ts              # Prisma client (ใช้เฉพาะงานที่ต้องคุยกับ DB ตรง ๆ)

prisma/
├── schema.prisma
└── sql/                   # migration ที่รันมือ

scripts/
└── sync-profanity-words.mjs   # ส่งลิสต์คำหยาบไปลงฐานข้อมูล
```

## ระบบหลังบ้าน

### 🚫 ตัวกรองคำไม่สุภาพ

ใช้กับ **ชื่อเล่น / username / ไบโอ / คอมเมนต์รีวิว**

- ลิสต์คำอยู่ที่ `lib/profanity.ts` **ที่เดียว** แก้แล้วต้องรัน `node scripts/sync-profanity-words.mjs` เพื่อ sync ไปฝั่งฐานข้อมูล
- จับการเลี่ยงตัวกรองได้: เว้นวรรค (`ค ว ย`), ใส่จุด (`ค.ว.ย`), ตัวซ้ำ (`ควยยยย`), แทรกวรรณยุกต์ (`ค๋ว๋ย๋`), leetspeak (`f4ck`), อักขระล่องหน
- มีลิสต์คำสุภาพที่ตัวอักษรซ้อนกับคำหยาบ เพื่อไม่ให้ "หีบ" "เหี้ยมโหด" "สัสดี" โดนแบนผิด
- **บังคับจริงที่ trigger ฝั่งฐานข้อมูล** ส่วนฝั่งเว็บมีไว้เตือนผู้ใช้ให้เร็วขึ้นเท่านั้น

### 🔨 ระบบแบน

- แบนได้ 1–3650 วัน หรือถาวร พร้อมเหตุผลที่ผู้ใช้จะเห็นบนแถบแจ้งเตือน
- หมดกำหนดแล้วกลับมาใช้งานได้เอง ไม่ต้องรอแอดมินมาปลด
- บังคับด้วย **restrictive RLS policy** บนทุกตารางที่ผู้ใช้เขียนได้ — ต้องเป็น restrictive เพราะ policy แบบ permissive จะ OR กัน ต่อให้แก้อันหนึ่ง อีกอันก็ปล่อยผ่านอยู่ดี
- คนโดนแบน **ยังอ่านเว็บได้ปกติ** แค่เขียนอะไรไม่ได้

### 👥 ผู้เยี่ยมชม (guest)

คนที่ไม่ได้ล็อกอินไม่มีแถวใน `profiles` จึงไม่มี `role` ให้ใส่ — "guest" ในที่นี้คือสถานะโดยปริยายของคนที่ไม่มี session ซึ่งตรงกับ role `anon` ของ Supabase ที่ RLS ใช้ตัดสินอยู่แล้ว

สิ่งที่ guest ทำได้:

- ดูและค้นหา prompt สาธารณะทั้งหมด
- **คัดลอก prompt และยอดถูกนับให้** — กันซ้ำด้วย id สุ่มที่เก็บใน localStorage (`lib/guestId.ts`) ส่งไปเป็น `guest_id`
- เขียนรีวิวได้ โดยระบุชื่อเองหรือใช้ "ผู้เยี่ยมชม"

สิ่งที่ทำไม่ได้: โพสต์ prompt, กดถูกใจ, มีโปรไฟล์

> ⚠️ **ทำไมต้อง partial unique index** — ตอนแรกตารางกันซ้ำด้วย `unique (user_id, prompt_id)` ซึ่งใช้กับ guest ไม่ได้เลย เพราะ `user_id` เป็น null ทุกแถว และใน SQL ค่า null ไม่เท่ากับ null จึงไม่นับว่าซ้ำ ต้องแยกเป็น partial unique index สองชุด (`...user_unique` / `...guest_unique`)

### 🔑 กติกา username

- ยาว 3–15 ตัว ใช้ได้เฉพาะ `a-z 0-9 . _ -`
- เปลี่ยนได้ทุก 14 วัน มี pop-up ยืนยันก่อน
- บังคับด้วย trigger ฝั่งฐานข้อมูล

### 🔎 การค้นหา

เดิมใช้ full-text search บน `tsvector` ที่ตั้ง config เป็น `simple` ซึ่งต้องพิมพ์ตรงทั้งคำถึงจะเจอ ภาษาไทยที่ไม่มีเว้นวรรคจึงแทบไม่เจออะไรเลย — เปลี่ยนมาใช้ `ilike` ที่จับคำบางส่วนได้ ผ่านตัวช่วยกลาง `lib/promptSearch.ts` ที่ใช้ร่วมกันทั้งผลหน้าแรก การโหลดหน้าถัดไป และรายการแนะนำ ผลลัพธ์จึงตรงกันเสมอ

## แนวทางการเขียนโค้ด

- **สีทั้งเว็บมาจาก token ชุดเดียว** ใน `app/globals.css` ห้ามฮาร์ดโค้ดสีในหน้า ไม่งั้นธีมสว่างพัง
- **ใช้แค่ 2 ฟอนต์** — Prompt กับ JetBrains Mono ประกาศไว้ที่ `app/layout.tsx`
- **dropdown ต้องใช้ portal** — ถ้าใช้ `absolute` ธรรมดา จะโดน element แม่ที่มี `transform` หรือ `overflow-hidden` ตัดหรือทับ (ดู `SelectMenu.tsx` และ `SearchBox.tsx`)
- **นับตัวอักษรไทยเป็น grapheme** ไม่ใช่ `.length`
- **อนิเมชันพื้นหลังใช้ `transform` + `opacity` เท่านั้น** ก้อนแสงมี `blur()` รัศมีใหญ่ ถ้าไปขยับ `top`/`left` หน้าจะหนืดทันที
- **RLS ที่ปฏิเสธจะคืน 0 แถวโดยไม่มี error** ทุกครั้งที่เขียนต้อง `.select()` แล้วนับแถวเอง

## คำสั่งที่ใช้บ่อย

```bash
npm run dev              # dev server (Turbopack)
npm run build            # build production
npm start                # รัน production build
npm run lint             # ESLint
npx tsc --noEmit         # ตรวจ type ทั้งโปรเจกต์
npm run prisma:pull      # ดึง schema จากฐานข้อมูลจริง
npm run prisma:generate  # สร้าง Prisma Client ใหม่

node scripts/sync-profanity-words.mjs   # sync ลิสต์คำหยาบไปฐานข้อมูล
```

<div align="center">

**[⬆ กลับขึ้นบน](#-prompt-library)**

</div>

---

# 🇬🇧 English

> อ่านภาษาไทยได้ที่ [ภาษาไทย](#-ภาษาไทย)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
- [Conventions](#conventions)
- [Scripts](#scripts)

## Overview

A Thai-language library of AI prompts for image, video, and presentation generation. Visitors search for a prompt and copy it straight into whatever AI tool they use; registered users can publish their own prompts, leave reviews, and save favourites.

What this project takes seriously:

- **Real Thai language support** — character counting uses graphemes rather than code units ("น้ำใจ" counts as 3, not 5), and search matches partial words even without spaces between them
- **Rules enforced in the database** — the profanity filter, ban system, and username policy are triggers and RLS policies, not just client-side checks. The frontend talks to Supabase directly, so anything enforced only in the UI can be bypassed by calling the API by hand
- **Light/dark theming** driven by a single set of colour tokens

## Features

### For users

| Feature | Details |
| --- | --- |
| 🔍 **Search** | Matches title, description, and prompt body with partial-word support, plus live suggestions covering both prompts and users |
| 📋 **Copy** | One click copies the full prompt, **no sign-in required**. The counter tracks *unique people*, not clicks |
| ❤️ **Favourites** | Save prompts for later |
| ⭐ **Reviews** | 1–5 star ratings with comments, optionally anonymous. Guests can review without signing in |
| 🗂️ **Categories / media types / AI models** | Filter prompts along several dimensions |
| 👥 **Guests** | Browse, search, copy (counted), and review without an account |
| 👤 **Profile** | Avatar with built-in cropping, display name, bio, and a username changeable every 14 days |
| 🌐 **Public profiles** | `/u/[username]` shows someone's prompts — never their email |
| 🌗 **Light / dark theme** | Remembered locally |

### For admins

| Feature | Details |
| --- | --- |
| 📊 **Dashboard** | Prompt, user, and review counts |
| 📝 **Prompt management** | Search, filter by category/status, delete |
| 👥 **User management** | Change roles, ban/unban, filter by role and status |
| 💬 **Review moderation** | Filter by rating and reviewer type, search by text or prompt title |
| 🚫 **Ban system** | 1–3650 days or permanent, with a reason shown to the user. Temporary bans lift themselves |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (Google, Facebook OAuth) |
| ORM / Schema | Prisma 7 (used mainly for schema management) |
| Fonts | Prompt (Thai + Latin), JetBrains Mono (numerals / Latin) |

> ⚠️ **This version of Next.js has breaking changes** compared to what you may know. Read the guides under `node_modules/next/dist/docs/` before writing code, as `AGENTS.md` requires.

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (the free tier is enough)

### Steps

```bash
# 1. Install dependencies (postinstall runs prisma generate for you)
npm install

# 2. Create .env.local — see the next section

# 3. Run the SQL files in prisma/sql/ in order (see "Database")

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Project Settings → Database → Connection string
# pooled (port 6543) — used by the running app
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres
# direct (port 5432) — used by Prisma CLI commands
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-xxx.pooler.supabase.com:5432/postgres
```

> This project keeps everything in `.env.local`. Prisma normally reads only `.env`, so `prisma.config.ts` explicitly loads `.env.local` as well.

## Database

The schema lives in `prisma/schema.prisma`, introspected from Supabase via `npm run prisma:pull`.

### Main tables

| Table | Purpose |
| --- | --- |
| `profiles` | User profiles linked to `auth.users` — username, display name, avatar, bio, role, ban state |
| `prompts` | The prompts themselves, with cover image and view/like/copy counters |
| `categories` / `media_types` / `ai_models` | Reference data used for filtering |
| `reviews` | Ratings and comments from both members and guests |
| `favorites` | Saved prompts |
| `prompt_copies` | Who copied which prompt, used purely for deduplication — members keyed by `user_id`, guests by `guest_id` |
| `prompt_examples` / `prompt_tags` / `prompt_ai_models` | Prompt join tables |
| `profanity_words` | Banned word list, synced from `lib/profanity.ts` |

### SQL files

Run these in order in the Supabase SQL Editor (or via `psql`):

| File | What it does |
| --- | --- |
| `add-cover-position.sql` | Cover image crop position |
| `add-image-crop.sql` | Cover image zoom |
| `add-review-anonymous.sql` | Anonymous reviews |
| `copy-count-per-user.sql` | Copy count becomes people, not clicks |
| `remove-usage-history.sql` | Drops usage history, creates `prompt_copies` |
| `fix-prompt-copies-pk.sql` | Fixes the `prompt_copies` primary key (see note) |
| `add-profile-bio.sql` | Profile bio |
| `add-username-change-rule.sql` | 14-day username change rule |
| `add-profanity-guard.sql` | Database-level profanity filter |
| `add-ban-enforcement.sql` | Ban system that is actually enforced |
| `add-guest-copy-count.sql` | Lets signed-out visitors copy prompts and have it counted |

> 💡 **Lesson from `fix-prompt-copies-pk.sql`** — the table originally used `(user_id, prompt_id)` as its primary key, which is exactly the shape PostgREST uses to infer a many-to-many relationship. That gave `prompts` and `profiles` two relationship paths, so every query embedding `profiles(...)` failed site-wide with `PGRST201`. Join tables here must always carry their own surrogate primary key and rely on a `unique` constraint for deduplication.

## Project Structure

```
app/
├── page.tsx               # Landing page (hero + featured prompts)
├── home/                  # Full prompt listing
├── search/                # Search results
├── popular/               # Popularity ranking
├── favorites/             # Saved prompts
├── profile/               # My profile
├── u/[username]/          # Someone else's public profile
├── prompts/
│   ├── [id]/              # Prompt detail + reviews
│   └── new/               # Create / edit form
├── media-types/, ai-models/
├── login/, auth/callback/ # OAuth
├── admin/                 # Admin area (prompts / users / reviews)
└── components/            # Shared components

lib/
├── supabase/              # Browser and server clients
├── profanity.ts           # Profanity filter (single source for the word lists)
├── promptSearch.ts        # Shared search predicate
├── recordCopy.ts          # Copy-count rules (members + guests)
├── guestId.ts             # Per-browser id for signed-out visitors, used for deduplication
├── profileCache.ts        # Caches the profile to stop avatar flicker on refresh
├── localAvatar.ts         # Local avatar fallback
├── prepareImageUpload.ts
└── prisma.ts              # Prisma client, for the few paths that talk to the DB directly

prisma/
├── schema.prisma
└── sql/                   # Hand-run migrations

scripts/
└── sync-profanity-words.mjs   # Pushes the word list into the database
```

## Core Systems

### 🚫 Profanity filter

Applied to **display names, usernames, bios, and review comments**.

- The word lists live in `lib/profanity.ts` and nowhere else. After editing them, run `node scripts/sync-profanity-words.mjs` to push the change to the database
- Catches common evasions: spacing (`ค ว ย`), dots (`ค.ว.ย`), repeats (`ควยยยย`), injected Thai tone marks (`ค๋ว๋ย๋`), leetspeak (`f4ck`), and zero-width characters
- Keeps an allow-list for innocent words that overlap with banned ones, so "หีบ", "เหี้ยมโหด", and "สัสดี" are not blocked
- **Enforced by database triggers**; the client-side check exists only to give faster feedback

### 🔨 Ban system

- 1–3650 days or permanent, with a reason surfaced to the user in a banner
- Temporary bans expire on their own — no admin action needed
- Enforced through **restrictive RLS policies** on every user-writable table. They must be restrictive: permissive policies are OR'd together, so fixing one still leaves the others letting writes through
- Banned users **can still read the site**, they simply cannot write

### 👥 Guests

Signed-out visitors have no row in `profiles`, so there is no `role` to assign them. "Guest" here is simply the absence of a session, which maps to Supabase's `anon` role that RLS already keys off.

What a guest can do:

- Browse and search every public prompt
- **Copy a prompt and have it counted** — deduplicated by a random id kept in localStorage (`lib/guestId.ts`) and sent as `guest_id`
- Leave a review under a name of their choosing, or as "ผู้เยี่ยมชม"

What they cannot do: publish prompts, like, or own a profile.

> ⚠️ **Why partial unique indexes** — the table originally deduplicated with `unique (user_id, prompt_id)`, which does nothing for guests: their `user_id` is always null, and in SQL null never equals null, so no two rows ever collide. It now uses two partial unique indexes instead (`...user_unique` / `...guest_unique`).

### 🔑 Username rules

- 3–15 characters, limited to `a-z 0-9 . _ -`
- Changeable once every 14 days, with a confirmation dialog beforehand
- Enforced by a database trigger

### 🔎 Search

Search originally used full-text search over a `tsvector` built with the `simple` config, which requires whole-word matches — nearly useless for Thai, where words are not separated by spaces. It now uses `ilike` for partial matching through the shared helper in `lib/promptSearch.ts`, which backs the first page, infinite scroll, and the suggestion list alike, so all three always agree.

## Conventions

- **All colours come from one token set** in `app/globals.css`. Never hard-code a colour in a page, or the light theme breaks
- **Only two fonts** — Prompt and JetBrains Mono, declared in `app/layout.tsx`
- **Dropdowns must use a portal.** A plain `absolute` panel gets clipped or covered by any ancestor with `transform` or `overflow-hidden` (see `SelectMenu.tsx` and `SearchBox.tsx`)
- **Count Thai text in graphemes**, not `.length`
- **Background animations use `transform` and `opacity` only.** The glow blobs carry a large `blur()`; animating `top`/`left` makes the page crawl
- **An RLS denial returns zero rows with no error.** Always `.select()` after a write and check the row count yourself

## Scripts

```bash
npm run dev              # Dev server (Turbopack)
npm run build            # Production build
npm start                # Serve the production build
npm run lint             # ESLint
npx tsc --noEmit         # Type-check the whole project
npm run prisma:pull      # Pull the schema from the live database
npm run prisma:generate  # Regenerate the Prisma client

node scripts/sync-profanity-words.mjs   # Sync the profanity list to the database
```

<div align="center">

**[⬆ Back to top](#-prompt-library)**

</div>
