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
import { Button } from "@/components/ui/button"
import { Trash2, Upload, RotateCcw } from "lucide-react"
import { router, useForm } from "@inertiajs/react"
import { useEffect, useRef } from "react"

interface ScanFisik {
  id: number
  kode: string
  qty: number
}

export default function ScanFisik({ data }: { data: ScanFisik[] }) {
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: form, setData, post, reset } = useForm({
    kode: "",
  })

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
          <form onSubmit={submit} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Scan barcode di sini..."
              value={form.kode}
              onChange={(e) => setData("kode", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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
              }}
              className="max-w-sm text-lg"
              autoFocus
            />
          </form>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/stok/scan-fisik/export"}
            >
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
                <TableHead className="w-[80px] text-center">No</TableHead>
                <TableHead className="w-auto">Kode</TableHead>
                <TableHead className="w-[120px] text-center">Qty</TableHead>
                <TableHead className="w-[120px] text-center">Aksi</TableHead>
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

                  <TableCell className="font-mono truncate">
                    {item.kode}
                  </TableCell>

                  <TableCell className="text-center font-semibold">
                    {item.qty}
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  )
}
