import AdminTableSkeleton from '@/app/components/AdminTableSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-9 w-52 rounded bg-surface animate-pulse mb-6" />
      <AdminTableSkeleton columns={6} />
    </div>
  )
}
