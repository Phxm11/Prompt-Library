import Icon from '@/app/components/Icon'

// แบนเนอร์ error แบบเดียวกัน แทนที่เคยก๊อป <p className="text-accent2..."> ไว้คนละแบบในแต่ละหน้า
// message เป็น optional เพราะบางที่ (เช่น error จาก .rpc()) อยากโชว์แค่ข้อความรวม ๆ ไม่ต้องมี detail
export default function ErrorState({
  message,
  className = '',
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-accent2/30 bg-accent2/10 px-4 py-3 ${className}`}
    >
      <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-accent2" />
      <div className="min-w-0">
        <p className="text-sm text-accent2">โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง</p>
        {message && (
          <p className="mt-0.5 truncate font-mono text-xs text-accent2/70" title={message}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
