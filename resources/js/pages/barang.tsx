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
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Plus, Upload, MoreVertical, Pencil, Trash2, Printer, Columns, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Download } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { router, useForm } from "@inertiajs/react"
import Barcode from "react-barcode"
import JsBarcode from "jsbarcode"

interface BarangForm {
  kode: string
  nama_barang: string
  lokasi: string
  harga_toko: number
  harga_khusus: number
  diskon: number
}

interface Product {
  id: number
  kode: string
  nama_barang: string
  lokasi: string
  harga_toko: number
  harga_khusus: number
  diskon: number
}

interface SelectedItem {
  id: number
  nama_barang: string
  harga_khusus: number
  diskon: number
  kode: string
  qty: number
}

export default function BarangV2({ products }: { products: Product[] }) {
  const { data, setData } = useForm<BarangForm>({
    kode: "",
    nama_barang: "",
    lokasi: "",
    harga_toko: 0,
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
    harga_toko: true,
    harga_khusus: true,
    diskon: true,
    barcode: true,
  })
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [fileName, setFileName] = useState<string>("price-tag")
  const [isGenerating, setIsGenerating] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds([])
  }, [search])

  useEffect(() => {
    const itemIds = selectedItems.map(item => item.id)
    setSelectedIds(itemIds)
  }, [selectedItems])

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

  const totalItems = filteredProducts.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedData = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getPaginationRange = () => {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, currentPage + 2)

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const isAllSelected = paginatedData.length > 0 &&
    paginatedData.every((item) => selectedItems.some(selected => selected.id === item.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems(prev =>
        prev.filter(item => !paginatedData.some(p => p.id === item.id))
      )
    } else {
      const itemsToAdd = paginatedData
        .filter(item => !selectedItems.some(selected => selected.id === item.id))
        .map(item => ({
          id: item.id,
          nama_barang: item.nama_barang,
          harga_khusus: item.harga_khusus,
          diskon: item.diskon,
          kode: item.kode,
          qty: 1
        }))

      setSelectedItems(prev => [...prev, ...itemsToAdd])
    }
  }

  const toggleSelectOne = (id: number) => {
    const product = products.find(p => p.id === id)
    if (!product) return

    if (selectedItems.some(item => item.id === id)) {
      setSelectedItems(prev => prev.filter(item => item.id !== id))
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          id: product.id,
          nama_barang: product.nama_barang,
          harga_khusus: product.harga_khusus,
          diskon: product.diskon,
          kode: product.kode,
          qty: 1
        }
      ])
    }
  }

  const updateItemQty = (id: number, qty: number) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, qty) } : item
      )
    )
  }

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return
    if (!confirm(`Yakin ingin menghapus ${selectedItems.length} data yang dipilih?`)) return

    router.post("/barang/delete-selected", {
      ids: selectedItems.map(item => item.id)
    }, {
      onSuccess: () => {
        setSelectedItems([])
      }
    })
  }

  const handleDeleteAll = () => {
    if (!confirm("⚠️ SEMUA DATA BARANG akan dihapus. Tindakan ini tidak dapat dibatalkan! Lanjutkan?")) return

    router.post("/barang/delete-all", {
      onSuccess: () => {
        setSelectedItems([])
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("Yakin ingin menghapus barang ini?")) return
    router.delete(`/barang/${id}`)
  }

  const generatePdf = async (items: SelectedItem[], fileName: string) => {
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

  const generatePdfBarcode = async (items: SelectedItem[], fileName: string) => {
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

  const handlePrintPriceTag = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Price Tag</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .print-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .price-tag { 
            border: 1px solid #000; 
            padding: 10px; 
            width: 200px; 
            height: 120px;
            position: relative;
            page-break-inside: avoid;
          }
          .discount { background-color: #f97316; color: white; padding: 2px 5px; border-radius: 3px; }
          .old-price { text-decoration: line-through; color: #666; }
          .new-price { font-size: 18px; font-weight: bold; color: #000; }
          .logo { position: absolute; bottom: 5px; left: 5px; height: 20px; }
          .date { position: absolute; bottom: 5px; right: 5px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${selectedItems.flatMap(item =>
      Array.from({ length: item.qty }, (_, index) => `
              <div class="price-tag">
                <div style="background-color: ${item.diskon > 0 ? '#dc2626' : '#fbbf24'}; padding: 5px; margin: -10px -10px 10px -10px; text-align: center;">
                  <strong>${item.kode}</strong><br>
                  <small>${item.nama_barang}</small>
                </div>
                ${item.diskon > 0 ? `
                  <div style="text-align: center;">
                    <div class="old-price">${formatRupiah(item.harga_khusus)}</div>
                    <div class="new-price">${formatRupiah(hargaSetelahDiskon(item.harga_khusus, item.diskon))}</div>
                    <div class="discount">Diskon ${item.diskon}%</div>
                  </div>
                ` : `
                  <div style="text-align: center; font-size: 24px; font-weight: bold; margin-top: 20px;">
                    ${formatRupiah(item.harga_khusus)}
                  </div>
                `}
                <img src="/logo/IDEAL-LOGO_RETRACE.png" class="logo" />
                <div class="date">${new Date().toLocaleDateString('id-ID')}</div>
              </div>
            `).join('')
    ).join('')}
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handlePrintBarcode = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cetak Barcode</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .barcode-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .barcode-item { text-align: center; page-break-inside: avoid; }
          .barcode-name { font-size: 12px; margin-bottom: 5px; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
      </head>
      <body>
        <div class="barcode-container">
          ${selectedItems.flatMap(item =>
      Array.from({ length: item.qty }, (_, index) => `
              <div class="barcode-item">
                <div class="barcode-name">${item.nama_barang}</div>
                <svg class="barcode"
                  jsbarcode-format="CODE128"
                  jsbarcode-value="${item.kode}"
                  jsbarcode-textmargin="0"
                  jsbarcode-fontoptions="bold">
                </svg>
              </div>
            `).join('')
    ).join('')}
        </div>
        <script>
          JsBarcode(".barcode").init();
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, 500);
        <\/script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const handleImport = async () => {
    if (!importFile) return alert("Pilih file terlebih dahulu")
    const buffer = await importFile.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: "",
    })

    const rawItems = jsonData
      .slice(1)
      .map(row => ({
        kode: String(row[0] || "").trim(),        
        nama_barang: String(row[1] || "").trim(), 
        lokasi: "ALL",                               
        harga_toko: 0,
        harga_khusus: Number(
          String(row[6] || "").replace(/[^\d]/g, "")
        ) || 0,                                   
        diskon: 0,
      }))
      .filter(item => item.kode && item.nama_barang)



    const uniqueMap = new Map<string, any>()
    rawItems.forEach(item => {
      if (!uniqueMap.has(item.kode)) {
        uniqueMap.set(item.kode, item)
      }
    })

    const payload = Array.from(uniqueMap.values())

    if (payload.length === 0) {
      alert("Tidak ada data valid")
      return
    }

    router.post("/barang/import", { items: payload }, {
      onSuccess: () => {
        setImportFile(null)
        alert("Import berhasil")
      }
    })
  }

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    const exportData = filteredProducts.map((item, index) => ({
      No: index + 1,
      Kode: item.kode,
      "Nama Barang": item.nama_barang,
      Lokasi: item.lokasi,
      "Harga Toko": item.harga_toko,
      "Harga Khusus": item.harga_khusus,
      "Diskon %": item.diskon,
      "Harga Setelah Diskon": hargaSetelahDiskon(item.harga_khusus, item.diskon),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData, {
      origin: "A4",
    })

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ["LAPORAN DATA MASTER BARANG"],
        [`Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`],
      ],
      { origin: "A1" }
    )

    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
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
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Barang")
    XLSX.writeFile(workbook, `master-barang-${Date.now()}.xlsx`)
  }

  const openEdit = (item: Product) => {
    setEditId(item.id)
    setEditOpen(true)
    setData({
      kode: item.kode,
      nama_barang: item.nama_barang,
      lokasi: item.lokasi,
      harga_toko: item.harga_toko,
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
    <AppLayout title="BarangV2" subtitle="Kelola Price Tag dan Juga Barcode">
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
                    <Columns className="mr-2 h-4 w-4" /> Atur Kolom
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
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Data Barang</DialogTitle>
                  </DialogHeader>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.CSV,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    className="mt-4 w-full bg-orange-500 hover:bg-orange-600"
                    onClick={handleImport}
                  >
                    Import Data
                  </Button>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
              >
                <Upload className="mr-2 h-4 w-4 rotate-180" />
                Export Excel
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1 sm:flex-none">
                    <Printer className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Pengaturan Cetak</span>
                    <span className="sm:hidden">Pengaturan</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[600px] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Pengaturan Cetak</DialogTitle>
                  </DialogHeader>

                  {selectedItems.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nama File PDF</Label>
                        <Input
                          placeholder="contoh: price-tag-januari"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Item yang Dipilih ({selectedItems.reduce((sum, item) => sum + item.qty, 0)} label)</Label>
                        {selectedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded"
                          >
                            <div className="flex-1">
                              <p className="font-semibold">{item.nama_barang}</p>
                              <p className="text-sm text-muted-foreground">Kode: {item.kode}</p>
                              {item.diskon > 0 ? (
                                <div className="text-sm">
                                  <span className="line-through text-muted-foreground mr-2">
                                    {formatRupiah(item.harga_khusus)}
                                  </span>
                                  <span className="font-semibold text-orange-600">
                                    {formatRupiah(hargaSetelahDiskon(item.harga_khusus, item.diskon))}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm">{formatRupiah(item.harga_khusus)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQty(item.id, item.qty - 1)}
                                disabled={item.qty <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                className="w-20 text-center"
                                value={item.qty}
                                onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 1)}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateItemQty(item.id, item.qty + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={handlePrintPriceTag}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <Printer className="h-8 w-8 mb-2" />
                          <span>Cetak Price Tag</span>
                          <span className="text-xs text-muted-foreground">(Printer)</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => generatePdf(selectedItems, fileName)}
                          disabled={isGenerating}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <Download className="h-8 w-8 mb-2" />
                          <span>Download Price Tag</span>
                          <span className="text-xs text-muted-foreground">(PDF)</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={handlePrintBarcode}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <Printer className="h-8 w-8 mb-2" />
                          <span>Cetak Barcode</span>
                          <span className="text-xs text-muted-foreground">(Printer)</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => generatePdfBarcode(selectedItems, fileName)}
                          disabled={isGenerating}
                          className="flex flex-col items-center justify-center h-24"
                        >
                          <Download className="h-8 w-8 mb-2" />
                          <span>Download Barcode</span>
                          <span className="text-xs text-muted-foreground">(PDF)</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Pilih item terlebih dahulu dari tabel</p>
                    </div>
                  )}
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

        {/* Action bar untuk selected items */}
        {selectedItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {selectedItems.length} item dipilih ({selectedItems.reduce((sum, item) => sum + item.qty, 0)} label)
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
              <div className="flex-1"></div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="default" className="bg-orange-500 hover:bg-orange-600">
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrintPriceTag}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Price Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generatePdf(selectedItems, fileName)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Price Tag (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintBarcode}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Barcode
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => generatePdfBarcode(selectedItems, fileName)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Barcode (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <Table className="w-full">
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                  {visibleColumns.kode && <TableHead className="w-32 whitespace-nowrap">Kode</TableHead>}
                  {visibleColumns.nama_barang && <TableHead className="min-w-48 max-w-64 whitespace-nowrap">Nama Barang</TableHead>}
                  {visibleColumns.lokasi && <TableHead className="w-24 whitespace-nowrap">Lokasi</TableHead>}
                  {visibleColumns.harga_toko && <TableHead className="w-32 whitespace-nowrap">Harga Toko</TableHead>}
                  {visibleColumns.harga_khusus && <TableHead className="w-32 whitespace-nowrap">Harga Khusus</TableHead>}
                  {visibleColumns.diskon && <TableHead className="w-24 whitespace-nowrap text-center">Diskon</TableHead>}
                  {visibleColumns.barcode && <TableHead className="w-48 whitespace-nowrap">Barcode</TableHead>}
                  <TableHead className="w-40 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4"
                      />
                      <span>Pilih</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.map((item, index) => (
                  <TableRow key={item.id} className="border-b hover:bg-muted/30">
                    <TableCell className="text-center font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
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
                    {visibleColumns.harga_toko && (
                      <TableCell>
                        <span className="text-sm whitespace-nowrap">{formatRupiah(item.harga_toko)}</span>
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
                          checked={selectedItems.some(selected => selected.id === item.id)}
                          onChange={() => toggleSelectOne(item.id)}
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Halaman {currentPage} dari {totalPages} • Total {totalItems} data
              </span>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}