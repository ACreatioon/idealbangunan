import AppLayout from "@/components/layout/app-layout"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Upload, RotateCcw, Pencil } from "lucide-react"
import { router, useForm } from "@inertiajs/react"
import { useEffect, useRef } from "react"
import { useState } from "react"
import * as XLSX from "xlsx"

interface ScanFisik {
  id: number
  kode: string
  inspector: string
  qty: number
}

export default function ScanFisik({ data }: { data: ScanFisik[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState<number>(0)
  const [importFile, setImportFile] = useState<File | null>(null)
  const { data: form, setData, post, reset } = useForm({
    kode: "",
  })

  const handleImportExcel = async () => {
    if (!importFile) {
      alert("Pilih file terlebih dahulu")
      return
    }

    const buffer = await importFile.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
    })

    // ambil hanya kolom yang dibutuhkan
    const payload = rows
      .map((row) => ({
        kode: String(row.Barcode || "").trim(),
        inspector: String(row.Inspector || "").trim(),
        qty: Number(row.Quantity || 0),
      }))
      .filter(item => item.kode && item.qty > 0)

    if (payload.length === 0) {
      alert("Data tidak valid")
      return
    }

    router.post("/stok/scan-fisik/import", {
      items: payload
    }, {
      onSuccess: () => {
        setImportFile(null)
        alert("Import berhasil")
      }
    })
  }


  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!form.kode) return

    const timer = setTimeout(() => {
      post("/stok/scan-fisik", {
        preserveScroll: true,
        onSuccess: () => {
          reset()
          inputRef.current?.focus()
        },
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [form.kode, post, reset])

  const handleExport = () => {
    if (data.length === 0) {
      alert("Tidak ada data scan")
      return
    }

    const exportData = data.map((item, index) => ({
      No: index + 1,
      Kode: item.kode,
      Qty: item.qty,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(wb, ws, "Scan Fisik")
    XLSX.writeFile(wb, `scan-fisik-${Date.now()}.xlsx`)
  }

  const openEdit = (item: ScanFisik) => {
    setEditId(item.id)
    setEditQty(item.qty)
    setEditOpen(true)
  }

  const submitEdit = () => {
    if (!editId) return

    router.put(
      `/stok/scan-fisik/${editId}`,
      { qty: editQty },
      {
        preserveScroll: true,
        onSuccess: () => {
          setEditOpen(false)
          setEditId(null)
        },
      }
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.kode) return

    post("/stok/scan-fisik", {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        inputRef.current?.focus()
      },
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data scan ini?")) return
    router.delete(`/stok/scan-fisik/${id}`)
  }

  const handleReset = () => {
    if (!confirm("Reset semua hasil scan?")) return
    router.post("/stok/scan-fisik/reset")
  }

  return (
    <AppLayout
      title="Scan Fisik"
      subtitle="Scan barang menggunakan barcode"
    >
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />

            <Button
              onClick={handleImportExcel}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Upload className="mr-2 h-4 w-4" />
              Export Scan
            </Button>

            <Button
              variant="destructive"
              onClick={handleReset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Scan
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden w-full">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-center">No</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Belum ada data scan
                  </TableCell>
                </TableRow>
              )}

              {data.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">
                    {index + 1}
                  </TableCell>

                  <TableCell className="font-mono">{item.kode}</TableCell>
                  <TableCell>{item.inspector}</TableCell>
                  <TableCell className="text-center font-semibold">{item.qty}</TableCell>

                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Edit Qty Scan</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Qty</label>
                  <Input
                    type="number"
                    min={1}
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                  />
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Batal
                </Button>

                <Button
                  onClick={submitEdit}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  )
}
