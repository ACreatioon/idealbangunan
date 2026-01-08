type TopbarProps = {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="border-b border-black/30 px-6 py-4 flex items-center gap-6">
      <div className="min-w-[180px]">
        <h1 className="text-lg font-semibold leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-black/50 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
