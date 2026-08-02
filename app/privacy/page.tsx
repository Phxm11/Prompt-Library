import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว',
  description: 'นโยบายความเป็นส่วนตัวของ Prompt Library — ข้อมูลที่เก็บ วิธีใช้ และสิทธิ์ของผู้ใช้',
}

const sectionTitle = 'text-lg font-mono font-bold text-ink mt-10 mb-3'
const paragraph = 'text-sm text-muted leading-relaxed'
const listItem = 'text-sm text-muted leading-relaxed'

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-accent/80 tracking-widest uppercase mb-2">Legal</p>
      <h1 className="text-3xl font-extrabold text-ink mb-2">นโยบายความเป็นส่วนตัว</h1>
      <p className="text-xs text-faint font-mono">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <p className={`${paragraph} mt-6`}>
        Prompt Library (&ldquo;เรา&rdquo;) ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้ทุกคน
        เอกสารนี้อธิบายว่าเราเก็บข้อมูลอะไร ใช้ทำอะไร และผู้ใช้มีสิทธิ์อะไรบ้างเกี่ยวกับข้อมูลของตัวเอง
      </p>

      <h2 className={sectionTitle}>ข้อมูลที่เราเก็บ</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li className={listItem}>
          <strong className="text-ink">ข้อมูลบัญชี:</strong> เมื่อสมัครสมาชิกผ่าน Google หรือ Facebook เราได้รับอีเมล ชื่อ
          และรูปโปรไฟล์จากผู้ให้บริการนั้น เพื่อสร้างบัญชีผู้ใช้ในระบบของเรา
        </li>
        <li className={listItem}>
          <strong className="text-ink">เนื้อหาที่ผู้ใช้สร้าง:</strong> Prompt ที่โพสต์ รีวิว ความคิดเห็น รูปตัวอย่าง
          และข้อมูลโปรไฟล์ (เช่น ชื่อผู้ใช้ คำอธิบายตัวตน) ที่กรอกเพิ่มเติมในเว็บไซต์
        </li>
        <li className={listItem}>
          <strong className="text-ink">ข้อมูลการใช้งาน:</strong> จำนวนครั้งที่คัดลอก Prompt, การกดถูกใจ/บันทึกโปรด
          ใช้เพื่อจัดอันดับความนิยมและปรับปรุงเนื้อหาแนะนำ
        </li>
        <li className={listItem}>
          <strong className="text-ink">ตัวระบุผู้เยี่ยมชม (guest ID):</strong> สำหรับผู้ที่ยังไม่ได้ล็อกอิน
          เราเก็บรหัสสุ่มไว้ในเบราว์เซอร์ (localStorage) เพื่อกันการนับซ้ำเวลาคัดลอก Prompt เท่านั้น
          ไม่ผูกกับข้อมูลระบุตัวตนใด ๆ
        </li>
      </ul>

      <h2 className={sectionTitle}>เราใช้ข้อมูลเพื่ออะไร</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li className={listItem}>ยืนยันตัวตนและดูแลบัญชีผู้ใช้</li>
        <li className={listItem}>แสดง แนะนำ และจัดอันดับ Prompt ภายในเว็บไซต์</li>
        <li className={listItem}>ป้องกันการใช้งานในทางที่ผิด เช่น สแปมหรือเนื้อหาไม่เหมาะสม</li>
        <li className={listItem}>ปรับปรุงคุณภาพและฟีเจอร์ของเว็บไซต์</li>
      </ul>

      <h2 className={sectionTitle}>การแชร์ข้อมูลกับบุคคลที่สาม</h2>
      <p className={paragraph}>
        เราไม่ขายข้อมูลส่วนบุคคลของผู้ใช้ให้บุคคลภายนอก ข้อมูลจะถูกประมวลผลผ่านผู้ให้บริการที่จำเป็นต่อการทำงานของระบบเท่านั้น
        ได้แก่ Supabase (ฐานข้อมูลและระบบยืนยันตัวตน) และ Google / Facebook (สำหรับการล็อกอินผ่าน OAuth)
        ผู้ให้บริการเหล่านี้มีนโยบายความเป็นส่วนตัวของตัวเองกำกับการประมวลผลข้อมูลอีกชั้นหนึ่ง
      </p>

      <h2 className={sectionTitle}>สิทธิ์ของผู้ใช้</h2>
      <ul className="space-y-2 list-disc list-inside">
        <li className={listItem}>ขอดูหรือแก้ไขข้อมูลโปรไฟล์ของตัวเองได้ตลอดเวลาผ่านหน้าโปรไฟล์</li>
        <li className={listItem}>ลบ Prompt หรือรีวิวที่ตัวเองสร้างไว้ได้ทุกเมื่อ</li>
        <li className={listItem}>ขอให้ลบบัญชีและข้อมูลที่เกี่ยวข้องได้ โดยติดต่อผ่านช่องทางด้านล่าง</li>
      </ul>

      <h2 className={sectionTitle}>การเก็บรักษาข้อมูล</h2>
      <p className={paragraph}>
        เราเก็บข้อมูลบัญชีไว้ตราบเท่าที่ยังใช้งานบัญชีอยู่ หากขอให้ลบบัญชี ข้อมูลจะถูกลบออกจากระบบภายในระยะเวลาที่เหมาะสม
        ยกเว้นข้อมูลบางส่วนที่จำเป็นต้องเก็บไว้ตามกฎหมายหรือเพื่อป้องกันการใช้งานในทางที่ผิด
      </p>

      <h2 className={sectionTitle}>การเปลี่ยนแปลงนโยบาย</h2>
      <p className={paragraph}>
        เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่มีนัยสำคัญจะแจ้งให้ทราบผ่านหน้าเว็บไซต์
      </p>

      <h2 className={sectionTitle}>ติดต่อเรา</h2>
      <p className={paragraph}>
        หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการขอลบข้อมูล สามารถติดต่อได้ที่{' '}
        <a href="mailto:oiuzpoom00@gmail.com" className="text-accent hover:underline">
          oiuzpoom00@gmail.com
        </a>
      </p>
    </div>
  )
}
