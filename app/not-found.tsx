export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1
          className="section-title section-title-center text-7xl font-extrabold mb-4"
        >
          404
        </h1>

        <h2 className="section-title section-title-center text-lg font-extrabold mb-2">ไม่พบหน้านี้</h2>
        <p className="text-sm text-muted mb-8">
          Prompt หรือหน้าที่คุณกำลังหาอาจถูกลบไปแล้ว หรือ URL ไม่ถูกต้อง
        </p>

        <a
          href="/"
          className="inline-block px-5 py-2.5 rounded-lg font-mono text-sm bg-accent/10 text-accent border border-accent/60 hover:bg-accent/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all"
        >
          ← กลับหน้าหลัก
        </a>
      </div>
    </div>
  )
}