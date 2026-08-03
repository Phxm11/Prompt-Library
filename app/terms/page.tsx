import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ข้อกำหนดการใช้งาน',
  description: 'ข้อกำหนดและเงื่อนไขการใช้งาน Prompt Library',
}

const sectionTitle = 'text-lg font-mono font-bold text-ink mt-10 mb-3'
const paragraph = 'text-sm text-muted leading-relaxed'
const listItem = 'text-sm text-muted leading-relaxed'

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-accent/80 tracking-widest uppercase mb-2">Legal</p>
      <h1 className="text-3xl font-extrabold text-ink mb-2">ข้อกำหนดการใช้งาน</h1>
      <p className="text-xs text-faint font-mono">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <p className={`${paragraph} mt-6`}>
        การเข้าใช้งานเว็บไซต์ Prompt Library (&ldquo;เว็บไซต์&rdquo;) ถือว่าผู้ใช้ยอมรับข้อกำหนดการใช้งานฉบับนี้
        หากไม่ยอมรับข้อกำหนดใด กรุณางดใช้งานเว็บไซต์
      </p>

      <h2 className={sectionTitle}>การใช้งานบัญชี</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li className={listItem}>ผู้ใช้ต้องรับผิดชอบต่อความถูกต้องของข้อมูลที่ให้ไว้ตอนสมัครสมาชิกผ่าน Google หรือ Facebook</li>
        <li className={listItem}>ห้ามสร้างบัญชีปลอมหรือแอบอ้างเป็นบุคคล/องค์กรอื่น</li>
        <li className={listItem}>ผู้ใช้ต้องรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของตนเอง</li>
      </ul>

      <h2 className={sectionTitle}>เนื้อหาที่ผู้ใช้สร้าง</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li className={listItem}>ผู้ใช้เป็นเจ้าของ Prompt รีวิว และเนื้อหาอื่นที่โพสต์ลงเว็บไซต์ แต่อนุญาตให้เว็บไซต์แสดงและเผยแพร่เนื้อหานั้นต่อสาธารณะได้</li>
        <li className={listItem}>ห้ามโพสต์เนื้อหาที่ผิดกฎหมาย ละเมิดลิขสิทธิ์ผู้อื่น หยาบคาย หรือสร้างความเสียหายต่อบุคคลอื่น</li>
        <li className={listItem}>เราขอสงวนสิทธิ์ในการลบเนื้อหาที่ละเมิดข้อกำหนดนี้โดยไม่ต้องแจ้งล่วงหน้า</li>
      </ul>

      <h2 className={sectionTitle}>ข้อจำกัดความรับผิดชอบ</h2>
      <p className={paragraph}>
        เว็บไซต์เป็นคลังรวบรวม Prompt สำหรับใช้กับเครื่องมือ AI ต่าง ๆ เราไม่รับประกันผลลัพธ์ที่ได้จากการนำ Prompt
        ไปใช้งานกับบริการภายนอก และไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานเนื้อหาดังกล่าว
      </p>

      <h2 className={sectionTitle}>การระงับการใช้งาน</h2>
      <p className={paragraph}>
        เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีผู้ใช้ที่ละเมิดข้อกำหนดการใช้งานนี้ โดยไม่ต้องแจ้งล่วงหน้า
      </p>

      <h2 className={sectionTitle}>การเปลี่ยนแปลงข้อกำหนด</h2>
      <p className={paragraph}>
        เราอาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่มีนัยสำคัญจะแจ้งให้ทราบผ่านหน้าเว็บไซต์
      </p>

      <h2 className={sectionTitle}>ติดต่อเรา</h2>
      <p className={paragraph}>
        หากมีคำถามเกี่ยวกับข้อกำหนดการใช้งานนี้ สามารถติดต่อได้ที่{' '}
        <a href="mailto:oiuzpoom00@gmail.com" className="text-accent hover:underline">
          oiuzpoom00@gmail.com
        </a>
      </p>
    </div>
  )
}
