'use client'

import { useState } from "react"
import {
  LayoutDashboard,
  Boxes,
  ClipboardCheck,
  User,
  LogOut,
  ChevronUp,
  Scan,
  BarChart3,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

import { router, usePage } from "@inertiajs/react"
import { SharedData } from "@/types"

export default function Sidebar() {
  const { auth } = usePage<SharedData>().props
  const [openLogout, setOpenLogout] = useState(false)

  return (
    <>
      <aside className="fixed w-64 border-r border-black/30 px-4 py-6 flex flex-col h-full">
        <div className="mb-8">
          <img src="/logo/IDEAL-LOGO_RETRACE.png" alt="" />
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={16} />} label="Dashboard" link="/dashboard" />
          <SidebarItem icon={<Boxes size={16} />} label="Master Barang" link="/barang" />
          <SidebarItem icon={<ClipboardCheck size={16} />} label="Opname Stok" link="/stok/opname" />
          <SidebarItem icon={<Scan size={16} />} label="Scan Fisik" link="/stok/scan-fisik" />
          <SidebarItem icon={<BarChart3 size={16} />} label="Laporan" link="/laporan" />
        </nav>

        <div className="pt-4 border-t border-black/10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-black/10 transition">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 flex items-center justify-center rounded-full bg-orange-500/90 text-white">
                    <User size={16} />
                  </div>

                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-sm font-semibold text-black">
                      {auth.user.name}
                    </span>
                    <span className="text-[11px] text-black/60">
                      {auth.user.email}
                    </span>
                    <span className="text-[10px] mt-0.5 px-2 py-0.5 rounded bg-orange-500/20 text-orange-600 w-fit">
                      {auth.user.role}
                    </span>
                  </div>
                </div>

                <ChevronUp size={16} className="text-black/50" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56 bg-white border border-black/20 text-black">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setOpenLogout(true)
                }}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut size={14} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <AlertDialog open={openLogout} onOpenChange={setOpenLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun ini?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => router.post('/logout')}
            >
              Iya, Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SidebarItem({
  icon,
  label,
  link,
}: {
  icon: React.ReactNode
  label: string
  link: string
}) {
  const { url } = usePage()
  const isActive = url.startsWith(link)

  return (
    <a
      href={link}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
        isActive ? "bg-orange-500/90 text-white" : "hover:bg-black/15"
      }`}
    >
      {icon}
      {label}
    </a>
  )
}
