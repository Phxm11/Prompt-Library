import Link from 'next/link'
import Icon from '@/app/components/Icon'

type IconName = React.ComponentProps<typeof Icon>['name']

// ใช้แทนข้อความเปล่า ๆ ที่กระจัดกระจายอยู่ทุกหน้า (list, ผลค้นหา, รีวิว, admin)
// ให้หน้าตาตรงกันหมดสักที — ไอคอนวงกลม + ข้อความ + ปุ่มพาไปทำอะไรต่อ (ถ้ามี)
export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  bordered = true,
  compact = false,
  className = '',
}: {
  icon?: IconName
  title: string
  description?: string
  action?: { label: string; href: string }
  bordered?: boolean
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={`animate-spring-up flex flex-col items-center gap-3 px-6 text-center ${
        compact ? 'py-8' : 'py-16'
      } ${bordered ? 'rounded-xl border border-dashed border-line' : ''} ${className}`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-surface text-faint">
        <Icon name={icon} size={22} />
      </span>
      <div>
        <p className="font-mono text-sm text-muted">
          {'>'} {title}
        </p>
        {description && <p className="mt-1.5 text-xs text-faint">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="mt-1 text-sm font-mono text-accent transition-colors hover:text-accent-soft"
        >
          {action.label} →
        </Link>
      )}
    </div>
  )
}
