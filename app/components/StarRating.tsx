'use client'

type StarRatingProps = {
  value: number
  onChange?: (rating: number) => void
  size?: number
  readOnly?: boolean
}

export default function StarRating({ value, onChange, size = 20, readOnly = false }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-1">
      {stars.map((star) => {
        const filled = star <= Math.round(value)
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? '#facc15' : 'none'}
              stroke={filled ? '#facc15' : 'var(--faint)'}
              strokeWidth="1.5"
            >
              <path d="M12 2.5l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7-5.4-4.7 7.1-.7z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}