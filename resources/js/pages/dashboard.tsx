'use client'

import AppLayout from "@/components/layout/app-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Boxes, Users, Receipt, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <Card>
          <CardContent className="group cursor-pointer flex items-center justify-between p-6 py-0">
            <div>
              <p className="text-base text-black/60">Total Barang</p>
              <h2 className="text-3xl font-bold text-black">128</h2>
            </div>
            <Boxes className="group-hover:text-gray-500 transition-all duration-300 h-24 w-24 text-orange-500/80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="group cursor-pointer flex items-center justify-between p-6 py-0">
            <div>
              <p className="text-base text-black/60">Total User</p>
              <h2 className="text-3xl font-bold text-black">12</h2>
            </div>
            <Users className="group-hover:text-gray-500 transition-all duration-300 h-24 w-24 text-blue-500/80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="group cursor-pointer flex items-center justify-between p-6 py-0">
            <div>
              <p className="text-base text-black/60">Penjualan Hari Ini</p>
              <h2 className="text-3xl font-bold text-black">24</h2>
            </div>
            <Receipt className="group-hover:text-gray-500 transition-all duration-300 h-24 w-24 text-green-500/80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="cursor-pointer group flex items-center justify-between p-6 py-0">
            <div>
              <p className="text-base text-black/60">Pendapatan</p>
              <h2 className="text-xl font-bold text-black">Rp 8.500.000</h2>
            </div>
            <TrendingUp className="group-hover:text-gray-500 transition-all duration-300 h-24 w-24 text-purple-500/80" />
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  )
}
