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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical, Pencil, Plus, Trash2, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { router, useForm } from "@inertiajs/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import * as XLSX from "xlsx"

interface Opname {
  id: number
  kode: string
  nama_barang: string
  stok_awal: number
  masuk: number
  keluar: number
  satuan: string
}

interface OpnameForm {
  kode: string
  nama_barang: string
  stok_awal: number
  masuk: number
  keluar: number
  satuan: string
}

export default function Opname({ opname }: { opname: Opname[] }) {
  const [search, setSearch] = useState("")
  const { data, setData, errors, post, processing } = useForm<OpnameForm>({
    kode: "",
    nama_barang: "",
    stok_awal: 0,
    masuk: 0,
    keluar: 0,
    satuan: ""
  })
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const getPaginationRange = () => {
    const start = currentPage
    const end = Math.min(currentPage + 4, totalPages)

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const resetForm = () =>
    setData({
      kode: "",
      nama_barang: "",
      stok_awal: 0,
      masuk: 0,
      keluar: 0,
      satuan: "",
    })

  const formatAngka = (value?: number) =>
    new Intl.NumberFormat("id-ID").format(value ?? 0)



  const filteredProducts = opname.filter((item) => {
    const keyword = search.toLowerCase()

    return (
      item.kode.toLowerCase().includes(keyword) ||
      item.nama_barang.toLowerCase().includes(keyword) ||
      item.satuan.toLowerCase().includes(keyword)
    )
  })

  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const paginatedData = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleImport = () => {
    if (!file) {
      alert("Pilih file terlebih dahulu")
      return
    }

    const reader = new FileReader()

    reader.onload = (e) => {
      const binary = e.target?.result
      if (!binary) return

      const workbook = XLSX.read(binary, { type: "binary" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      })

      const START_ROW = 4

      const result: any[] = []
      let lastItem: any = null

      rows.slice(START_ROW).forEach((row) => {
        const kode = String(row[1] || "").trim()
        const nama = String(row[5] || "").trim()
        const stokAwal = Number(row[8]) || 0
        const masuk = Number(row[12]) || 0
        const keluar = Number(row[13]) || 0
        const rawSatuan = String(row[16] || "")

        const satuan = rawSatuan.replace(/^[\d\s]+/g, "").trim()
        if (kode) {
          lastItem = {
            kode,
            nama_barang: nama,
            stok_awal: stokAwal,
            masuk,
            keluar,
            satuan,
          }

          result.push(lastItem)
          return
        }
        if (!kode && nama && lastItem) {
          lastItem.nama_barang += " " + nama
        }
      })

      if (result.length === 0) {
        alert("Tidak ada data valid yang bisa diimport")
        return
      }

      router.post(
        "/stok/opname/import",
        { data: result },
        {
          preserveScroll: true,
          onSuccess: () => {
            alert("Import berhasil")
            setFile(null)
          },
          onError: (err) => {
            console.error(err)
            alert("Gagal import data")
          },
        }
      )
    }

    reader.readAsBinaryString(file)
  }

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    const exportData = filteredProducts.map((item, index) => ({
      No: index + 1,
      Kode: item.kode,
      "Nama Barang": item.nama_barang,
      "Stok Awal": item.stok_awal,
      Masuk: item.masuk,
      Keluar: item.keluar,
      Sisa: item.stok_awal + item.masuk - item.keluar,
      Satuan: item.satuan,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      origin: "A4",
    })

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["LAPORAN STOK OPNAME"],
        [`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`],
      ],
      { origin: "A1" }
    )

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ]

    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"]!)

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: 3, c: C })]
      if (cell) cell.s = headerStyle
    }

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 15 },
      { wch: 35 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stok Opname")

    XLSX.writeFile(workbook, `stok-opname-${Date.now()}.xlsx`)
  }

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(item.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !paginatedData.some((p) => p.id === id))
      )
    } else {
      setSelectedIds((prev) => [
        ...new Set([...prev, ...paginatedData.map((p) => p.id)]),
      ])
    }
  }

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return

    if (!confirm("Yakin ingin menghapus data yang dipilih?")) return

    router.post(
      "/stok/opname/delete-selected",
      { ids: selectedIds },
      {
        onSuccess: () => setSelectedIds([]),
      }
    )
  }

  const handleDeleteAll = () => {
    if (!confirm("⚠️ SEMUA DATA akan dihapus. Lanjutkan?")) return

    router.post("/stok/opname/delete-all", {
      onSuccess: () => setSelectedIds([]),
    })
  }


  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    post("/stok/opname", {
      onSuccess: () => {
        setData({
          kode: "",
          nama_barang: "",
          stok_awal: 0,
          masuk: 0,
          keluar: 0,
          satuan: "",
        })
      }
    })
  }


  const handleDelete = (id: number) => {
    if (!confirm("Yakin ingin menghapus barang ini?")) return

    router.delete(`/stok/opname/${id}`)
  }


  const openEdit = (item: Opname) => {
    setEditId(item.id)
    setEditOpen(true)
    setData({
      kode: item.kode,
      nama_barang: item.nama_barang,
      stok_awal: item.stok_awal,
      masuk: item.masuk,
      keluar: item.keluar,
      satuan: item.satuan,
    })
  }

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editId) return

    router.put(`/stok/opname/${editId}`, data, {
      onSuccess: () => {
        setEditOpen(false)
        setEditId(null)
      },
    })
  }




  return (
    <AppLayout
      title="Stok Opname"
      subtitle="Kelola Data Opname"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </DialogTrigger>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Upload className="mr-2 h-4 w-4 rotate-180" />
                Export Excel
              </Button>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Data Barang</DialogTitle>
                </DialogHeader>

                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <Button className="mt-4 w-full" onClick={handleImport}>
                  Import
                </Button>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild onClick={resetForm}>
                <Button size="sm" className="flex-1 sm:flex-none">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Tambah Barang</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Tambah Barang
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kode">Kode</Label>
                      <Input
                        id="kode"
                        value={data.kode}
                        onChange={(e) => setData("kode", e.target.value)}
                        placeholder="Contoh: BRG-001"
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                      {errors.kode && (
                        <p className="text-sm text-red-500">{errors.kode}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lokasi">Stok Awal</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.stok_awal)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("stok_awal", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                      {errors.stok_awal && (
                        <p className="text-sm text-red-500">{errors.stok_awal}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama_barang">Nama Barang</Label>
                    <Input
                      id="nama_barang"
                      value={data.nama_barang}
                      onChange={(e) => setData("nama_barang", e.target.value)}
                      placeholder="Nama barang"
                      className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                    />
                    {errors.nama_barang && (
                      <p className="text-sm text-red-500">{errors.nama_barang}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stok">Satuan</Label>
                    <Input
                      id="satuan"
                      value={data.satuan}
                      onChange={(e) => setData("satuan", e.target.value)}
                      placeholder="Satuan (galon)"
                      className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                    />
                    {errors.satuan && (
                      <p className="text-sm text-red-500">{errors.satuan}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="masuk">Stok Masuk</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.masuk)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("masuk", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                      {errors.masuk && (
                        <p className="text-sm text-red-500">{errors.masuk}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keluar">Stok Keluar</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.keluar)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("keluar", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                      {errors.keluar && (
                        <p className="text-sm text-red-500">{errors.keluar}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline">
                        Batal
                      </Button>
                    </DialogTrigger>

                    <Button type="submit" disabled={processing} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold">
                      {processing ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">
                    Edit Barang
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={submitEdit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kode</Label>
                      <Input
                        value={data.kode}
                        onChange={(e) => setData("kode", e.target.value)}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Stok Awal</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.stok_awal)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("stok_awal", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Barang</Label>
                    <Input
                      value={data.nama_barang}
                      onChange={(e) => setData("nama_barang", e.target.value)}
                      className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Satuan</Label>
                    <Input
                      value={data.satuan}
                      onChange={(e) => setData("satuan", e.target.value)}
                      className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stok Masuk</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.masuk)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("masuk", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Stok Keluar</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.keluar)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("keluar", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditOpen(false)}
                    >
                      Batal
                    </Button>

                    <Button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                    >
                      Update
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <Table className="w-full">
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Kode</TableHead>
                  <TableHead className="min-w-48 max-w-64 whitespace-nowrap">Nama Barang</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Stok Awal</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Masuk</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Keluar</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Sisa</TableHead>
                  <TableHead className="w-32 whitespace-nowrap">Satuan</TableHead>
                  <TableHead className="w-32 whitespace-nowrap gap-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              {selectedIds.length > 0 && (
                <TableHeader className="bg-orange-50">
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium">
                          {selectedIds.length} item dipilih
                        </span>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteSelected}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Terpilih
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteAll}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus Semua
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHeader>
              )}

              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={item.id} className="border-b hover:bg-muted/30">
                    <TableCell className="text-center font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm whitespace-nowrap">{item.kode}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="break-words max-w-[250px] line-clamp-2 leading-tight overflow-hidden whitespace-normal">
                        {item.nama_barang}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">{item.stok_awal}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">{item.masuk}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium whitespace-nowrap">{item.keluar}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">{(item.stok_awal + item.masuk) - item.keluar}</span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.satuan}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelectOne(item.id)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </span>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft />
                </Button>

                {getPaginationRange().map((page) => (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === currentPage ? "default" : "outline"}
                    className={page === currentPage ? "bg-orange-500 text-white" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout >
  )
}
