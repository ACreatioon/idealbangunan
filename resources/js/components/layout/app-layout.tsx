import Sidebar from "./sidebar"
import Topbar from "./topbar"

type AppLayoutProps = {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function AppLayout({
  children,
  title,
  subtitle,
}: AppLayoutProps) {
  return (
    <div className="flex-1 flex h-full overflow-hidden">
      <Sidebar />

      <div className="ml-64 h-full flex flex-col overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />

        <main className="flex-1 p-6 overflow-y-auto max-w-[69rem]">
          {children}
        </main>
      </div>
    </div>
  )
}
