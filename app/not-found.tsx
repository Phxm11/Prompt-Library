export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs tracking-[0.3em] text-cyan-400/80 font-mono mb-4 uppercase">
          // 404_not_found
        </p>

        <h1
          className="text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-300 via-cyan-200 to-fuchsia-400 bg-clip-text text-transparent"
        >
          404
        </h1>

        <h2 className="text-lg font-semibold text-[#f2f2f7] mb-2">ไม่พบหน้านี้</h2>
        <p className="text-sm text-[#8888a0] mb-8">
          Prompt หรือหน้าที่คุณกำลังหาอาจถูกลบไปแล้ว หรือ URL ไม่ถูกต้อง
        </p>

        <a
          href="/"
          className="inline-block px-5 py-2.5 rounded-lg font-mono text-sm bg-cyan-500/10 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/20 hover:shadow-[0_0_16px_rgba(0,229,255,0.25)] transition-all"
        >
          ← กลับหน้าหลัก
        </a>
      </div>
    </div>
  )
}