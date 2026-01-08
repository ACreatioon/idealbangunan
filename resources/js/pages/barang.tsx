'use client'

import AppLayout from "@/components/layout/app-layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Upload, MoreVertical, Pencil, Trash2, Printer, Columns } from "lucide-react"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { router, useForm } from "@inertiajs/react"
import Barcode from "react-barcode"
import JsBarcode from "jsbarcode"


interface BarangForm {
  kode: string
  nama_barang: string
  lokasi: string
  stok: number
  harga_toko: number
  harga_dc: number
  harga_khusus: number
  diskon: number
}

interface Product {
  id: number
  kode: string
  nama_barang: string
  lokasi: string
  stok: number
  harga_toko: number
  harga_dc: number
  harga_khusus: number
  diskon: number
}


export default function Barang({ products }: { products: Product[] }) {
  const { data, setData, errors, post, processing } = useForm<BarangForm>({
    kode: "",
    nama_barang: "",
    lokasi: "",
    stok: 0,
    harga_toko: 0,
    harga_dc: 0,
    harga_khusus: 0,
    diskon: 0,
  })
  const [search, setSearch] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    kode: true,
    nama_barang: true,
    lokasi: true,
    stok: true,
    harga_toko: true,
    harga_dc: true,
    harga_khusus: true,
    diskon: true,
    barcode: true,
  })
  const [selectedItems, setSelectedItems] = useState<{
    id: number
    nama_barang: string
    harga_khusus: number
    diskon: number
    kode: string
    qty: number
  }[]>([])
  const [fileName, setFileName] = useState<string>("price-tag");
  const [isGenerating, setIsGenerating] = useState(false)
  const resetForm = () =>
    setData({
      kode: "",
      nama_barang: "",
      lokasi: "",
      stok: 0,
      harga_toko: 0,
      harga_dc: 0,
      harga_khusus: 0,
      diskon: 0,
    })

  const formatAngka = (value?: number) =>
    new Intl.NumberFormat("id-ID").format(value ?? 0)


  const hargaSetelahDiskon = (harga: number, diskon: number) => {
    if (diskon <= 0) return harga
    return harga - (harga * diskon) / 100
  }

  const filteredProducts = products.filter((item) => {
    const keyword = search.toLowerCase()

    return (
      item.kode.toLowerCase().includes(keyword) ||
      item.nama_barang.toLowerCase().includes(keyword) ||
      item.lokasi.toLowerCase().includes(keyword)
    )
  })

  const formatRupiah = (value: number | string) => {
    const number = Number(value) || 0

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number)
  }


  const generatePdf = async (items: typeof selectedItems, fileName: string) => {
    try {
      setIsGenerating(true)
      const { default: jsPDF } = await import("jspdf")
      const pdf = new jsPDF("p", "mm", "a4")

      const cols = 3
      const gapX = 4
      const gapY = 6
      const labelWidth = 63
      const labelHeight = 35
      const pageWidth = pdf.internal.pageSize.getWidth()
      const totalGridWidth = cols * labelWidth + (cols - 1) * gapX
      const marginX = (pageWidth - totalGridWidth) / 2
      const marginY = 10
      const headerHeight = 18
      const headerPadding = 0.5

      let index = 0

      const expandedItems = items.flatMap(item =>
        Array.from({ length: item.qty }, () => item)
      )

      expandedItems.forEach(item => {
        const col = index % cols
        const row = Math.floor(index / cols)

        let x = marginX + col * (labelWidth + gapX)
        let y = marginY + row * (labelHeight + gapY)
        const bodyTop = y + headerHeight
        const bodyHeight = labelHeight - headerHeight
        const centerY = bodyTop + bodyHeight / 2

        if (y + labelHeight + gapY > 290) {
          pdf.addPage()
          index = 0
          x = marginX
          y = marginY
        }

        pdf.setLineWidth(0.3)
        pdf.setDrawColor(0)
        pdf.rect(x, y, labelWidth, labelHeight)
        if (item.diskon > 0) {
          pdf.setFillColor(220, 38, 38)
        } else {
          pdf.setFillColor(255, 235, 59)
        }
        pdf.rect(
          x + headerPadding,
          y + headerPadding,
          labelWidth - headerPadding * 2,
          headerHeight - headerPadding,
          "F"
        )

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(7)
        pdf.text(item.kode, x + labelWidth / 2, y + 5, {
          align: "center",
        })

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(9)
        pdf.text(item.nama_barang, x + labelWidth / 2, y + 10, {
          align: "center",
          maxWidth: labelWidth - 6,
        })

        pdf.setLineDash([2, 2])
        pdf.line(x, y + headerHeight, x + labelWidth, y + headerHeight)
        pdf.setLineDash([])

        if (item.diskon > 0) {
          const hargaLama = item.harga_khusus
          const hargaBaru = hargaSetelahDiskon(hargaLama, item.diskon)

          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(9)
          pdf.setTextColor(220, 38, 38)
          const oldPriceX = x + 4
          const oldPriceY = y + headerHeight + 6
          const oldPriceText = formatRupiah(hargaLama)
          pdf.text(oldPriceText, oldPriceX, oldPriceY)
          const textWidth = pdf.getTextWidth(oldPriceText)
          const fontSize = pdf.getFontSize()
          const strikeY = oldPriceY - fontSize * 0.15
          pdf.setLineWidth(0.4)
          pdf.line(
            oldPriceX,
            strikeY,
            oldPriceX + textWidth,
            strikeY
          )

          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(15)
          pdf.setTextColor(0)
          pdf.text(
            formatRupiah(hargaBaru),
            x + labelWidth / 2,
            centerY + 2,
            { align: "center" }
          )

          pdf.setFontSize(7)
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(220, 38, 38)
          pdf.text(
            // `Diskon ${item.diskon}%`,
            'promo',
            x + labelWidth / 2,
            centerY + 7,
            { align: "center" }
          )
        } else {
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(15)
          pdf.setTextColor(0)

          pdf.text(
            formatRupiah(item.harga_khusus),
            x + labelWidth / 2,
            centerY + 1,
            { align: "center" }
          )
        }

        pdf.addImage("/logo/IDEAL-LOGO_RETRACE.png", "PDF", x + 2, y + labelHeight - 6 - 2, 14, 6)

        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(0)
        pdf.setFontSize(6)
        const today = new Date().toLocaleDateString("id-ID")
        pdf.text(today, x + labelWidth - 2, y + labelHeight - 3, {
          align: "right",
        })
        index++
      })

      pdf.save(`${fileName || "price-tag"}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePdfBarcode = async (
    items: typeof selectedItems,
    fileName: string
  ) => {
    try {
      setIsGenerating(true)

      const { default: jsPDF } = await import("jspdf")
      const pdf = new jsPDF("p", "mm", "a4")

      const cols = 3
      const gapX = 8
      const gapY = 12
      const barcodeWidth = 50
      const barcodeHeight = 18
      const marginX = 10
      const marginY = 12

      let index = 0

      const expandedItems = items.flatMap(item =>
        Array.from({ length: item.qty }, () => item)
      )

      expandedItems.forEach((item) => {
        const col = index % cols
        const row = Math.floor(index / cols)
        let x = marginX + col * (barcodeWidth + gapX)
        let y = marginY + row * (barcodeHeight + gapY)
        if (y + barcodeHeight > 290) {
          pdf.addPage()
          index = 0
          x = marginX
          y = marginY
        }

        const canvas = document.createElement("canvas")
        const scale = 3
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        canvas.width = 400 * scale
        canvas.height = 120 * scale
        ctx.scale(scale, scale)

        JsBarcode(canvas, item.kode, {
          format: "CODE128",
          width: 1,
          height: 25,
          displayValue: true,
          fontSize: 10,
        })

        const img = canvas.toDataURL("image/png")
        const imgProps = pdf.getImageProperties(img)
        const pdfWidth = 50
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        pdf.addImage(img, "PNG", x, y, pdfWidth, pdfHeight)

        index++
      })

      pdf.save(`${fileName || "barcode"}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }


  const submit = (e: React.FormEvent) => {
    e.preventDefault()

    post("/barang", {
      onSuccess: () => {
        setData({
          kode: "",
          nama_barang: "",
          lokasi: "",
          stok: 0,
          harga_toko: 0,
          harga_dc: 0,
          harga_khusus: 0,
          diskon: 0
        })
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("Yakin ingin menghapus barang ini?")) return

    router.delete(`/barang/${id}`)
  }

  const openEdit = (item: Product) => {
    setEditId(item.id)
    setEditOpen(true)
    setData({
      kode: item.kode,
      nama_barang: item.nama_barang,
      lokasi: item.lokasi,
      stok: item.stok,
      harga_toko: item.harga_toko,
      harga_dc: item.harga_dc,
      harga_khusus: item.harga_khusus,
      diskon: item.diskon
    })
  }

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!editId) return

    router.put(`/barang/${editId}`, data, {
      onSuccess: () => {
        setEditOpen(false)
        setEditId(null)
      },
    })
  }


  return (
    <AppLayout title="Master Barang" subtitle="Kelola Data Master Barang">
      <div className="space-y-4 w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Cari barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Columns />Atur Kolom
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56">
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() =>
                        setVisibleColumns((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        readOnly
                        className="mr-2"
                      />
                      {key.replace("_", " ").toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Import</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data Barang</DialogTitle>
                  </DialogHeader>
                  <Input type="file" accept=".xlsx,.xls,.csv" />
                  <Button className="mt-4 w-full">Import</Button>
                </DialogContent>
              </Dialog>

              {selectedItems.length === 0 ? (
                <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                  <span className="hidden sm:flex gap-1 items-center"><Printer />Cetak Barcode</span>
                  <span className="sm:hidden">Barcode</span>
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <span className="hidden sm:flex gap-1 items-center"><Printer />Cetak Barcode</span>
                      <span className="sm:hidden">Barcode</span>
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[600px] max-h-[600px] overflow-y-scroll">
                    <DialogHeader>
                      <DialogTitle>Pengaturan Barcode</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {selectedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{item.nama_barang}</p>
                            <Barcode
                              value={item.kode}
                              height={30}
                              width={1.2}
                              fontSize={15}
                              displayValue={true}
                            />
                          </div>

                          <Input
                            type="number"
                            min={1}
                            className="w-full sm:w-20"
                            value={item.qty}
                            onChange={(e) =>
                              setSelectedItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id
                                    ? { ...i, qty: Number(e.target.value) }
                                    : i
                                )
                              )
                            }
                          />
                        </div>
                      ))}


                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Nama File PDF
                        </label>
                        <Input
                          placeholder="contoh: price-tag-januari"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                        />
                      </div>

                      <Button
                        disabled={isGenerating}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => generatePdfBarcode(selectedItems, fileName)}
                      >
                        {isGenerating ? "Membuat PDF..." : "Cetak PDF"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {selectedItems.length === 0 ? (
                <Button variant="outline" size="sm" disabled className="flex-1 sm:flex-none">
                  <span className="hidden sm:flex gap-1 items-center"><Printer />Cetak Price Tag</span>
                  <span className="sm:hidden">Price Tag</span>
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <span className="hidden sm:flex gap-1 items-center"><Printer />Cetak Price Tag</span>
                      <span className="sm:hidden">Price Tag</span>
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Pengaturan Price Tag</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      {selectedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{item.nama_barang}</p>

                            {item.diskon > 0 ? (
                              <div className="text-sm">
                                <span className="line-through text-muted-foreground mr-2">
                                  {formatRupiah(item.harga_khusus)}
                                </span>
                                <span className="font-semibold text-orange-600">
                                  {formatRupiah(
                                    hargaSetelahDiskon(
                                      item.harga_khusus,
                                      item.diskon
                                    )
                                  )}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm">
                                {formatRupiah(item.harga_khusus)}
                              </p>
                            )}
                          </div>

                          <Input
                            type="number"
                            min={1}
                            className="w-full sm:w-20"
                            value={item.qty}
                            onChange={(e) =>
                              setSelectedItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id
                                    ? { ...i, qty: Number(e.target.value) }
                                    : i
                                )
                              )
                            }
                          />
                        </div>
                      ))}


                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Nama File PDF
                        </label>
                        <Input
                          placeholder="contoh: price-tag-januari"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                        />
                      </div>

                      <Button
                        disabled={isGenerating}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => generatePdf(selectedItems, fileName)}
                      >
                        {isGenerating ? "Membuat PDF..." : "Cetak PDF"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

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
                        <Label htmlFor="lokasi">Lokasi</Label>
                        <Input
                          id="lokasi"
                          value={data.lokasi}
                          onChange={(e) => setData("lokasi", e.target.value)}
                          placeholder="Gudang / Rak"
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                        {errors.lokasi && (
                          <p className="text-sm text-red-500">{errors.lokasi}</p>
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
                      <Label htmlFor="stok">Stok</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.stok)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("stok", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                      {errors.stok && (
                        <p className="text-sm text-red-500">{errors.stok}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="harga_toko">Harga Toko</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_toko)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_toko", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                        {errors.harga_toko && (
                          <p className="text-sm text-red-500">{errors.harga_toko}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="harga_dc">Harga DC</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_dc)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_dc", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                        {errors.harga_dc && (
                          <p className="text-sm text-red-500">{errors.harga_dc}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Harga Khusus</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_khusus)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_khusus", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Diskon (%)</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.diskon)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("diskon", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
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
                        <Label>Lokasi</Label>
                        <Input
                          value={data.lokasi}
                          onChange={(e) => setData("lokasi", e.target.value)}
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
                      <Label>Stok</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatAngka(data.stok)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "")
                          setData("stok", Number(raw))
                        }}
                        className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Harga Toko</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_toko)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_toko", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Harga DC</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_dc)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_dc", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Harga Khusus</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.harga_khusus)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("harga_khusus", Number(raw))
                          }}
                          className="bg-transparent border-black/20 text-black placeholder:text-black/40 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0 focus-visible:border-orange-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Diskon (%)</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={formatAngka(data.diskon)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "")
                            setData("diskon", Number(raw))
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
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <Table className="w-full">
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                  {visibleColumns.kode && <TableHead className="w-32 whitespace-nowrap">Kode</TableHead>}
                  {visibleColumns.nama_barang && <TableHead className="min-w-48 max-w-64 whitespace-nowrap">Nama Barang</TableHead>}
                  {visibleColumns.lokasi && <TableHead className="w-24 whitespace-nowrap">Lokasi</TableHead>}
                  {visibleColumns.stok && <TableHead className="w-20 whitespace-nowrap">Stok</TableHead>}
                  {visibleColumns.harga_toko && <TableHead className="w-32 whitespace-nowrap">Harga Toko</TableHead>}
                  {visibleColumns.harga_dc && <TableHead className="w-32 whitespace-nowrap">Harga DC</TableHead>}
                  {visibleColumns.harga_khusus && <TableHead className="w-32 whitespace-nowrap">Harga Khusus</TableHead>}
                  {visibleColumns.diskon && <TableHead className="w-24 whitespace-nowrap text-center">Diskon</TableHead>}
                  {visibleColumns.barcode && <TableHead className="w-48 whitespace-nowrap">Barcode</TableHead>}
                  <TableHead className="w-32 whitespace-nowrap">Aksi</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredProducts.map((item, index) => (
                  <TableRow key={item.id} className="border-b hover:bg-muted/30">
                    <TableCell className="text-center font-medium">
                      {index + 1}
                    </TableCell>
                    {visibleColumns.kode && (
                      <TableCell>
                        <span className="font-mono text-sm whitespace-nowrap">{item.kode}</span>
                      </TableCell>
                    )}
                    {visibleColumns.nama_barang && (
                      <TableCell className="py-3">
                        <div className="break-words max-w-[250px] line-clamp-2 leading-tight overflow-hidden whitespace-normal">
                          {item.nama_barang}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.lokasi && (
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{item.lokasi}</span>
                      </TableCell>
                    )}
                    {visibleColumns.stok && (
                      <TableCell>
                        <span className="font-medium whitespace-nowrap">{item.stok}</span>
                      </TableCell>
                    )}
                    {visibleColumns.harga_toko && (
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{formatRupiah(item.harga_toko)}</span>
                      </TableCell>
                    )}
                    {visibleColumns.harga_dc && (
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{formatRupiah(item.harga_dc)}</span>
                      </TableCell>
                    )}
                    {visibleColumns.harga_khusus && (
                      <TableCell>
                        {visibleColumns.diskon && item.diskon > 0 ? (
                          <div className="flex flex-col">
                            <span className="line-through text-orange-600 text-xs whitespace-nowrap">
                              {formatRupiah(item.harga_khusus)}
                            </span>
                            <span className="font-semibold text-sm whitespace-nowrap">
                              {formatRupiah(hargaSetelahDiskon(
                                item.harga_khusus,
                                item.diskon
                              ))}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm whitespace-nowrap">
                            {formatRupiah(item.harga_khusus)}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.diskon && (
                      <TableCell className="text-center">
                        {item.diskon > 0 ? (
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full whitespace-nowrap">
                            {item.diskon}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.barcode && (
                      <TableCell>
                        <div className="scale-90 origin-left">
                          <Barcode
                            value={item.kode}
                            height={25}
                            width={1}
                            fontSize={10}
                            displayValue={false}
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.some((i) => i.id === item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems((prev) => [
                                ...prev,
                                {
                                  id: item.id,
                                  nama_barang: item.nama_barang,
                                  harga_khusus: item.harga_khusus,
                                  diskon: item.diskon,
                                  kode: item.kode,
                                  qty: 1,
                                },
                              ])
                            } else {
                              setSelectedItems((prev) =>
                                prev.filter((i) => i.id !== item.id)
                              )
                            }
                          }}
                          className="h-4 w-4"
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
          </div>
        </div>

      </div>
    </AppLayout>
  )
}