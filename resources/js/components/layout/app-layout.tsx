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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="ml-64 flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} />

        <main className="flex-1 p-6 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

