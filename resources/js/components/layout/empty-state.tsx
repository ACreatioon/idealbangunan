import { FileCode } from "lucide-react"

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <FileCode size={48} className="text-black/30 mb-4" />
      <h2 className="text-lg font-semibold">No Content Found</h2>
      <p className="text-sm text-black/50 mt-1 max-w-sm">
        Create your first Content
      </p>
    </div>
  )
}
