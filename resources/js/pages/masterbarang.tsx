import AppLayout from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Upload, Search, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useState } from "react"
import { router } from "@inertiajs/react"

interface MasterBarang {
  id: number
  kode: string
  nama_barang: string
  lokasi: string
}

interface Props {
  masterbarangs: {
    data: MasterBarang[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  filters: {
    search?: string
  }
}

export default function MasterBarang({ masterbarangs, filters }: Props) {
  const [isImporting, setIsImporting] = useState(false)
  const [search, setSearch] = useState(filters.search || "")
  const [editOpen, setEditOpen] = useState(false)
  const [editData, setEditData] = useState<MasterBarang | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)

  useEffect(() => {
    const delay = setTimeout(() => {
      router.get(
        "/masterbarang",
        { search },
        {
          preserveState: true,
          replace: true,
        }
      )
    }, 500)

    return () => clearTimeout(delay)
  }, [search])


  const handleImport = async () => {
    if (!importFile) {
      alert("Pilih file terlebih dahulu")
      return
    }

    setIsImporting(true)

    try {
      const buffer = await importFile.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        defval: "",
      })

      const items = rows
        .slice(1)
        .map(row => ({
          kode: String(row[1] || "").trim(),
          nama_barang: String(row[3] || "").trim(),
          lokasi: "ALL",
        }))
        .filter(i => i.kode && i.nama_barang)

      if (items.length === 0) {
        alert("Tidak ada data valid")
        setIsImporting(false)
        return
      }

      router.post("/master-barang/import", { items }, {
        onSuccess: () => {
          setImportFile(null)
          setIsImporting(false)
        },
        onError: () => setIsImporting(false),
      })
    } catch (e: any) {
      setIsImporting(false)
      alert(e.message)
    }
  }

  const handleExport = () => {
    if (masterbarangs.data.length === 0) {
      alert("Tidak ada data untuk di-export")
      return
    }

    const exportData = masterbarangs.data.map((item, index) => ({
      No: index + 1,
      Kode: item.kode,
      "Nama Barang": item.nama_barang,
      Lokasi: item.lokasi,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Master Barang")
    XLSX.writeFile(wb, `master-barang-${Date.now()}.xlsx`)
  }

  const openEdit = (item: MasterBarang) => {
    setEditData(item)
    setEditOpen(true)
  }

  const submitEdit = () => {
    if (!editData) return

    router.put(`/masterbarang/${editData.id}`, {
      nama_barang: editData.nama_barang,
      lokasi: editData.lokasi,
    }, {
      onSuccess: () => {
        setEditOpen(false)
        setEditData(null)
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data master barang ini?")) return
    router.delete(`/masterbarang/${id}`, {
      preserveScroll: true,
    })
  }

  const handleDeleteAll = () => {
    if (!confirm("⚠️ SEMUA DATA MASTER BARANG akan dihapus!\nTindakan ini tidak bisa dibatalkan.\n\nLanjutkan?")) {
      return
    }

    router.post("/masterbarang/delete-all", {
      preserveScroll: true,
    })
  }


  const goToPage = (page: number) => {
    router.get("/masterbarang", { search, page }, {
      preserveState: true,
      replace: true,
    })
  }

  const getPaginationRange = () => {
    const current = masterbarangs.current_page
    const total = masterbarangs.last_page
    const start = Math.max(1, current - 2)
    const end = Math.min(total, current + 2)

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <AppLayout
      title="Master Barang"
      subtitle="Master dari semua barang"
    >
      <div className="space-y-4 min-w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari kode atau nama barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Semua
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Import Data Barang</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />

                    {importFile && (
                      <p className="text-sm text-muted-foreground">
                        File: <span className="font-medium">{importFile.name}</span>
                      </p>
                    )}

                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                    >
                      {isImporting ? "Importing..." : "Import Data"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={handleExport}>
                <Upload className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-center w-16">No</TableHead>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead className="text-center">Lokasi</TableHead>
                  <TableHead className="text-center w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {masterbarangs.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {filters.search
                        ? "Tidak ada data yang sesuai pencarian"
                        : "Belum ada data master barang"}
                    </TableCell>
                  </TableRow>
                ) : (
                  masterbarangs.data.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="text-center">
                        {(masterbarangs.current_page - 1) * masterbarangs.per_page + index + 1}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">{item.kode}</TableCell>
                      <TableCell>{item.nama_barang}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.lokasi}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {masterbarangs.last_page > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t">
                <div className="text-sm text-gray-600">
                  Menampilkan{" "}
                  <span className="font-semibold">
                    {(masterbarangs.current_page - 1) * masterbarangs.per_page + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-semibold">
                    {Math.min(masterbarangs.current_page * masterbarangs.per_page, masterbarangs.total)}
                  </span>{" "}
                  dari <span className="font-semibold">{masterbarangs.total}</span> data
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={masterbarangs.current_page === 1}
                    onClick={() => goToPage(1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={masterbarangs.current_page === 1}
                    onClick={() => goToPage(masterbarangs.current_page - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex gap-1 mx-2">
                    {getPaginationRange().map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === masterbarangs.current_page ? "default" : "outline"}
                        className={page === masterbarangs.current_page ? "bg-orange-500 hover:bg-orange-600" : ""}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={masterbarangs.current_page === masterbarangs.last_page}
                    onClick={() => goToPage(masterbarangs.current_page + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={masterbarangs.current_page === masterbarangs.last_page}
                    onClick={() => goToPage(masterbarangs.last_page)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Master Barang</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Kode Barang</label>
                  <Input
                    value={editData?.kode || ""}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Nama Barang</label>
                  <Input
                    value={editData?.nama_barang || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, nama_barang: e.target.value } : null)}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Lokasi</label>
                  <Input
                    value={editData?.lokasi || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, lokasi: e.target.value } : null)}
                  />
                </div>
              </div>

              <DialogFooter>
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