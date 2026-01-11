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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Upload, RotateCcw, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { router } from "@inertiajs/react"
import { useState } from "react"
import * as XLSX from "xlsx"

interface ScanFisik {
  id: number
  kode: string
  inspector: string
  qty: number
}

export default function ScanFisik({ data }: { data: ScanFisik[] }) {
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState<number>(0)
  const [importFile, setImportFile] = useState<File | null>(null)
  
  // State untuk filter dan pagination
  const [search, setSearch] = useState("")
  const [selectedInspector, setSelectedInspector] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  // Ambil daftar inspector unik dari data
  const inspectors = Array.from(new Set(data.map(item => item.inspector))).filter(Boolean)
  
  // Filter data berdasarkan search dan inspector
  const filteredData = data.filter(item => {
    const matchesSearch = item.kode.toLowerCase().includes(search.toLowerCase())
    const matchesInspector = selectedInspector === "all" || item.inspector === selectedInspector
    return matchesSearch && matchesInspector
  })
  
  // Hitung total data
  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  // Paginate data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  
  // Fungsi untuk mendapatkan range pagination
  const getPaginationRange = () => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)
    
    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }
  
  // Reset ke halaman 1 ketika filter berubah
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

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
        handleFilterChange()
      }
    })
  }

  const handleExport = () => {
    if (data.length === 0) {
      alert("Tidak ada data scan")
      return
    }

    const exportData = data.map((item, index) => ({
      No: index + 1,
      Kode: item.kode,
      Inspector: item.inspector,
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

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data scan ini?")) return
    router.delete(`/stok/scan-fisik/${id}`, {
      preserveScroll: true,
      onSuccess: () => {
        // Jika halaman kosong setelah hapus, mundur ke halaman sebelumnya
        if (paginatedData.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1)
        }
      }
    })
  }

  const handleReset = () => {
    if (!confirm("Reset semua hasil scan?")) return
    router.post("/stok/scan-fisik/reset", {
      preserveScroll: true,
      onSuccess: () => {
        setCurrentPage(1)
      }
    })
  }

  return (
    <AppLayout
      title="Scan Fisik"
      subtitle="Daftar hasil scan fisik barang"
    >
      <div className="flex flex-col gap-4">

        {/* Filter dan Actions */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari kode barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  handleFilterChange()
                }}
                className="pl-10"
              />
            </div>
            
            <Select
              value={selectedInspector}
              onValueChange={(value) => {
                setSelectedInspector(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pilih Inspector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Inspector</SelectItem>
                {inspectors.map((inspector, index) => (
                  <SelectItem key={index} value={inspector}>
                    {inspector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-40"
              />

              <Button
                onClick={handleImportExcel}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!importFile}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </div>
            
            <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
              <Upload className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={data.length === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="border rounded-md overflow-hidden w-full">
          <Table className="w-full">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-center w-16">No</TableHead>
                <TableHead>Kode Barcode</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-center w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {data.length === 0 
                      ? "Belum ada data scan" 
                      : "Tidak ada data yang sesuai dengan filter"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>

                    <TableCell className="font-mono">{item.kode}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.inspector || "Tidak ada"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{item.qty}</TableCell>

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> -{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                dari <span className="font-semibold">{totalItems}</span> data
                {selectedInspector !== "all" && (
                  <span className="ml-2">
                    (Filter: {selectedInspector})
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1 mx-2">
                  {getPaginationRange().map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === currentPage ? "default" : "outline"}
                      className={page === currentPage ? "bg-orange-500 hover:bg-orange-600" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Edit Qty Scan</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="text-lg py-2"
                  autoFocus
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
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}