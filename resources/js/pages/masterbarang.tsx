"use client"

import AppLayout from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import { router } from "@inertiajs/react"
import { useState } from "react"

export default function MasterBarang() {
  const [file, setFile] = useState<File | null>(null)

  const handleImport = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu")
      return
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: "",
    })

    const items = rows
      .slice(1) // 🔥 mulai dari row 2
      .map(row => ({
        kode: String(row[1] || "").trim(),        // B
        nama_barang: String(row[3] || "").trim(),// D
        lokasi: "ALL",
      }))
      .filter(i => i.kode && i.nama_barang)

    if (items.length === 0) {
      alert("Tidak ada data valid")
      return
    }

    router.post(route("master-barang.import"), { items }, {
      onSuccess: () => {
        setFile(null)
        alert("Import master barang berhasil")
      }
    })
  }

  return (
    <AppLayout
        title="Master Barang"
        subtitle="Master dari semua barang"
    >
      <div className="max-w-md space-y-4">
        <Input
          type="file"
          accept=".xlsx,.csv"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />

        <Button onClick={handleImport}>
          Import Master Barang
        </Button>
      </div>
    </AppLayout>
  )
}
