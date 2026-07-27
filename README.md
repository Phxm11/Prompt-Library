This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to self-host exactly two typefaces, declared in `app/layout.tsx`:

| ฟอนต์ | ใช้กับ | ตัวแปร | น้ำหนัก | Utility |
| --- | --- | --- | --- | --- |
| Prompt | ภาษาไทย (subset `thai` + `latin`) — ฟอนต์หลักทั้งเว็บ | `--font-prompt` | 300–800 | `font-sans` |
| Baloo 2 | ตัวเลข/ภาษาอังกฤษ (subset `latin`) สไตล์น่ารัก | `--font-baloo` | 500–800 | `font-display`, `font-mono` |

Baloo 2 ไม่มีกลุ่มตัวอักษรไทย จึงตั้ง Prompt เป็น fallback ต่อท้ายใน `app/globals.css` — ห้ามเพิ่มฟอนต์อื่นนอกเหนือจากสองตัวนี้

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
