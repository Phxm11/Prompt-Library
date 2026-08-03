import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'คำแนะนำการลบข้อมูล',
  description: 'วิธีขอลบบัญชีและข้อมูลส่วนบุคคลจาก Prompt Library',
}

const sectionTitle = 'text-lg font-mono font-bold text-ink mt-10 mb-3'
const paragraph = 'text-sm text-muted leading-relaxed'

export default function DataDeletionPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-accent/80 tracking-widest uppercase mb-2">Legal</p>
      <h1 className="text-3xl font-extrabold text-ink mb-2">คำแนะนำการลบข้อมูล</h1>
      <p className="text-xs text-faint font-mono">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <p className={`${paragraph} mt-6`}>
        หากต้องการลบบัญชีและข้อมูลส่วนบุคคลของคุณออกจาก Prompt Library ไม่ว่าจะสมัครสมาชิกผ่าน Google หรือ Facebook
        สามารถทำได้ตามขั้นตอนด้านล่าง
      </p>

      <h2 className={sectionTitle}>วิธีขอลบข้อมูล</h2>
      <ol className="space-y-2 list-decimal list-inside">
        <li className={paragraph}>
          ส่งอีเมลมาที่{' '}
          <a href="mailto:oiuzpoom00@gmail.com?subject=ขอลบบัญชีและข้อมูล" className="text-accent hover:underline">
            oiuzpoom00@gmail.com
          </a>{' '}
          โดยระบุหัวข้อว่า &ldquo;ขอลบบัญชีและข้อมูล&rdquo;
        </li>
        <li className={paragraph}>แจ้งอีเมลหรือชื่อบัญชีที่ใช้สมัครสมาชิกไว้ในเว็บไซต์</li>
        <li className={paragraph}>เราจะดำเนินการตรวจสอบและลบบัญชีพร้อมข้อมูลที่เกี่ยวข้องภายใน 30 วัน และแจ้งผลกลับทางอีเมล</li>
      </ol>

      <h2 className={sectionTitle}>ข้อมูลที่จะถูกลบ</h2>
      <p className={paragraph}>
        เมื่อคำขอได้รับการยืนยัน เราจะลบข้อมูลบัญชี (อีเมล ชื่อ รูปโปรไฟล์ที่ได้รับจาก Google/Facebook)
        และเนื้อหาที่ผูกกับบัญชีนั้น เช่น Prompt รีวิว และความคิดเห็นที่โพสต์ไว้
        ยกเว้นข้อมูลบางส่วนที่จำเป็นต้องเก็บไว้ตามกฎหมายหรือเพื่อป้องกันการใช้งานในทางที่ผิด
      </p>

      <h2 className={sectionTitle}>ติดต่อเรา</h2>
      <p className={paragraph}>
        หากมีคำถามเพิ่มเติมเกี่ยวกับการลบข้อมูล สามารถติดต่อได้ที่{' '}
        <a href="mailto:oiuzpoom00@gmail.com" className="text-accent hover:underline">
          oiuzpoom00@gmail.com
        </a>
      </p>
    </div>
  )
}
