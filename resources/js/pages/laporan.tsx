'use client'

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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Download, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

interface ScanFisik {
  id: number
  kode: string
  inspector: string
  qty: number
}

interface Opname {
  id: number
  kode: string
  nama_barang: string
  stok_awal: number
  masuk: number
  keluar: number
  satuan: string
  harga_khusus?: number
}

interface LaporanItem {
  kode: string
  nama_barang: string
  stok_awal: number
  masuk: number
  keluar: number
  sisa_opname: number
  qty_scan: number
  selisih: number
  harga_khusus: number
  harga_total: number
  satuan: string
  inspector?: string
  hasScan: boolean
}


export default function Laporan({
  opname: opnameData,
  scanfisik: scanData
}: {
  opname: Opname[]
  scanfisik: ScanFisik[]
}) {
  const [search, setSearch] = useState("")
  const [laporanData, setLaporanData] = useState<LaporanItem[]>([])
  const [exportLoading, setExportLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const normalizeKode = (kode: string) => kode.trim().toUpperCase()
  const ITEMS_PER_PAGE = 15
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, showAll])

  useEffect(() => {
    const processedData: LaporanItem[] = []

    const scanMap = new Map<string, ScanFisik>()
    scanData.forEach(scan => {
      const kode = normalizeKode(scan.kode)

      if (scanMap.has(kode)) {
        const existing = scanMap.get(kode)!
        scanMap.set(kode, {
          ...existing,
          qty: existing.qty + scan.qty
        })
      } else {
        scanMap.set(kode, {
          ...scan,
          kode
        })
      }
    })

    opnameData.forEach(item => {
      const scanItem = scanMap.get(normalizeKode(item.kode))
      const sisa_opname = item.stok_awal + item.masuk - item.keluar
      const qty_scan = scanItem?.qty || 0
      const selisih = qty_scan - sisa_opname
      const harga_khusus = item.harga_khusus ?? 0
      const harga_total = selisih * harga_khusus

      processedData.push({
        kode: item.kode,
        nama_barang: item.nama_barang,
        stok_awal: item.stok_awal,
        masuk: item.masuk,
        keluar: item.keluar,
        sisa_opname,
        qty_scan,
        selisih,
        harga_khusus,
        harga_total,
        satuan: item.satuan,
        inspector: scanItem?.inspector,
        hasScan: scanItem !== undefined
      })
    })

    setLaporanData(processedData)
  }, [opnameData, scanData])

  const filteredData = laporanData.filter((item) => {
    const keyword = search.toLowerCase()
    const hasKeyword = item.kode.toLowerCase().includes(keyword) ||
      item.nama_barang.toLowerCase().includes(keyword) ||
      item.satuan.toLowerCase().includes(keyword) ||
      (item.inspector?.toLowerCase() || '').includes(keyword)

    if (!showAll) {
      return hasKeyword && item.hasScan
    }
    return hasKeyword
  })

  const dataWithScan = laporanData.filter(item => item.hasScan)
  const dataWithoutScan = laporanData.filter(item => !item.hasScan)

  const totalItems = filteredData.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
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

  const formatAngka = (value?: number) =>
    new Intl.NumberFormat("id-ID").format(value ?? 0)

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diexport")
      return
    }

    setExportLoading(true)

    try {
      const exportData = filteredData.map((item, index) => ({
        No: index + 1,
        Kode: item.kode,
        "Nama Barang": item.nama_barang,
        "Stok Awal": item.stok_awal,
        "Stok Masuk": item.masuk,
        "Stok Keluar": item.keluar,
        "Sisa Stok (Opname)": item.sisa_opname,
        "Qty Scan": item.qty_scan,
        "Selisih": item.selisih,
        "Harga Khusus (Rp)": item.harga_khusus,
        "Harga Total (Rp)": item.harga_total,
        "Status": item.selisih === 0
          ? "SESUAI"
          : item.selisih > 0
            ? "LEBIH"
            : "KURANG",
        "Satuan": item.satuan,
        "Inspector": item.inspector || "-"
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok")

      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(workbook, `laporan-stok-${date}.xlsx`)
    } catch (error) {
      console.error("Export error:", error)
      alert("Gagal mengexport data")
    } finally {
      setExportLoading(false)
    }
  }

  const calculateTotals = () => {
    const filteredForTotals = showAll ? dataWithScan : filteredData

    return filteredForTotals.reduce((acc, item) => ({
      totalSisa: acc.totalSisa + item.sisa_opname,
      totalScan: acc.totalScan + item.qty_scan,
      totalSelisih: acc.totalSelisih + item.selisih,
      countSesuai: acc.countSesuai + (item.selisih === 0 ? 1 : 0),
      countLebih: acc.countLebih + (item.selisih > 0 ? 1 : 0),
      countKurang: acc.countKurang + (item.selisih < 0 ? 1 : 0)
    }), {
      totalSisa: 0,
      totalScan: 0,
      totalSelisih: 0,
      countSesuai: 0,
      countLebih: 0,
      countKurang: 0
    })
  }

  const totals = calculateTotals()

  return (
    <AppLayout
      title="Laporan"
      subtitle="Cetak Laporan dan Kelola data Laporan"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Barang di-Scan</h3>
            <p className="text-2xl font-bold text-green-600">
              {dataWithScan.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">dari {laporanData.length} barang</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Scan Fisik</h3>
            <p className="text-2xl font-bold text-orange-600">
              {formatAngka(totals.totalScan)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Hasil scanning fisik</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Selisih</h3>
            <p className={`text-2xl font-bold ${totals.totalSelisih > 0 ? 'text-green-600' :
              totals.totalSelisih < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
              {totals.totalSelisih > 0 ? '+' : ''}{formatAngka(totals.totalSelisih)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-green-600">{totals.countLebih} Lebih</span>,
              <span className="text-red-600 ml-2">{totals.countKurang} Kurang</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Persentase Kesesuaian</h3>
            <p className="text-2xl font-bold text-purple-600">
              {filteredData.length > 0
                ? Math.round((totals.countSesuai / filteredData.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totals.countSesuai} dari {filteredData.length} barang sesuai
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari kode, nama barang, atau inspector..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>

            <Button
              variant={showAll ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className={showAll ? "bg-orange-600 hover:bg-orange-700" : "border-orange-500 text-orange-500 hover:bg-orange-50"}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAll ? "Semua Barang" : "Hanya Sudah Scan"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exportLoading || filteredData.length === 0}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              {exportLoading ? "Mengexport..." : "Export Excel"}
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="min-w-48">Nama Barang</TableHead>
                  <TableHead className="text-center">Stok Awal</TableHead>
                  <TableHead className="text-center">Masuk</TableHead>
                  <TableHead className="text-center">Keluar</TableHead>
                  <TableHead className="text-center">Sisa (Opname)</TableHead>
                  <TableHead className="text-center">Qty Scan</TableHead>
                  <TableHead className="text-right">Harga Khusus</TableHead>
                  <TableHead className="text-center">Selisih</TableHead>
                  <TableHead className="text-right">Harga Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Inspector</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <TableRow
                      key={`${item.kode}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.kode}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={item.nama_barang}>
                          {item.nama_barang}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAngka(item.stok_awal)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAngka(item.masuk)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAngka(item.keluar)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatAngka(item.sisa_opname)}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatAngka(item.qty_scan)}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {formatAngka(item.harga_khusus)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${item.selisih > 0 ? 'text-green-600' :
                          item.selisih < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                          {item.selisih > 0 ? '+' : ''}{formatAngka(item.selisih)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {formatAngka(item.harga_total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.selisih === 0
                          ? 'bg-gray-100 text-gray-800'
                          : item.selisih > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {item.selisih === 0 ? 'SESUAI' :
                            item.selisih > 0 ? 'LEBIH' : 'KURANG'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.satuan}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {item.inspector || '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      <div className="text-gray-500">
                        <Search className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Tidak ada data ditemukan</p>
                        {!showAll && dataWithScan.length === 0 && (
                          <p className="text-sm mt-1">
                            Tidak ada barang yang sudah di-scan
                          </p>
                        )}
                        {showAll && dataWithoutScan.length === 0 && (
                          <p className="text-sm mt-1">
                            Semua barang sudah di-scan
                          </p>
                        )}
                        {search && (
                          <p className="text-sm mt-1">
                            Coba dengan kata kunci lain
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {paginatedData.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t">
              <div className="text-sm text-gray-600">
                Menampilkan {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems)}-
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} dari {totalItems} data
                <span className="ml-2">
                  {showAll && `(${dataWithScan.length} di-scan, ${dataWithoutScan.length} belum)`}
                  {!showAll && `(hanya barang yang sudah di-scan)`}
                </span>
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
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPaginationRange().map(page => (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    className={`h-8 w-8 p-0 ${currentPage === page
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : ''
                      }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
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
      </div>
    </AppLayout>
  )
}