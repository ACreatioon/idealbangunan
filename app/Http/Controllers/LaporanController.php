<?php

namespace App\Http\Controllers;

use App\Models\Opname;
use App\Models\Scanfisik;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LaporanController extends Controller
{
    public function index()
    {
        try {
            $opname = Opname::select([
                'id',
                'kode',
                'nama_barang',
                'stok_awal',
                'masuk',
                'keluar',
                'satuan'
            ])->orderBy('kode')->get();

            $scanfisik = Scanfisik::select([
                'id',
                'kode',
                'inspector',
                'qty',
                'created_at'
            ])->orderBy('kode')->get();

            return Inertia::render('laporan', [
                'opname' => $opname,
                'scanfisik' => $scanfisik,
                'success' => session('success'),
                'error' => session('error'),
            ]);

        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal memuat data laporan: ' . $e->getMessage());
        }
    }

    public function exportExcel(Request $request)
    {
        try {
            $request->validate([
                'search' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $opname = $this->getFilteredOpname($request);
            $scanfisik = $this->getFilteredScanFisik($request);

            $laporanData = $this->processLaporanData($opname, $scanfisik);

            return response()->json([
                'success' => true,
                'data' => $laporanData,
                'total' => count($laporanData),
                'date' => now()->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal memproses data export: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroyScanFisik($id)
    {
        try {
            $scan = Scanfisik::findOrFail($id);
            $scan->delete();

            return redirect()->route('laporan')->with('success', 'Data scan fisik berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->route('laporan')->with('error', 'Gagal menghapus data: ' . $e->getMessage());
        }
    }

    private function getFilteredOpname(Request $request)
    {
        $query = Opname::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('kode', 'LIKE', "%{$search}%")
                  ->orWhere('nama_barang', 'LIKE', "%{$search}%");
            });
        }

        return $query->orderBy('kode')->get();
    }

        private function getFilteredScanFisik(Request $request)
    {
        $query = Scanfisik::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('kode', 'LIKE', "%{$search}%")
                  ->orWhere('inspector', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return $query->orderBy('kode')->get();
    }

    private function processLaporanData($opname, $scanfisik)
    {
        $processedData = [];
        
        $scanMap = [];
        foreach ($scanfisik as $scan) {
            $kode = $scan->kode;
            if (!isset($scanMap[$kode])) {
                $scanMap[$kode] = [
                    'total_qty' => 0,
                    'inspectors' => [],
                    'latest_scan' => $scan->created_at
                ];
            }
            $scanMap[$kode]['total_qty'] += $scan->qty;
            
            if ($scan->inspector && !in_array($scan->inspector, $scanMap[$kode]['inspectors'])) {
                $scanMap[$kode]['inspectors'][] = $scan->inspector;
            }
        }

        foreach ($opname as $item) {
            $sisa_opname = $item->stok_awal + $item->masuk - $item->keluar;
            $scanData = $scanMap[$item->kode] ?? null;
            $qty_scan = $scanData ? $scanData['total_qty'] : 0;
            $selisih = $qty_scan - $sisa_opname;

            $processedData[] = [
                'kode' => $item->kode,
                'nama_barang' => $item->nama_barang,
                'stok_awal' => (int)$item->stok_awal,
                'masuk' => (int)$item->masuk,
                'keluar' => (int)$item->keluar,
                'sisa_opname' => $sisa_opname,
                'qty_scan' => $qty_scan,
                'selisih' => $selisih,
                'satuan' => $item->satuan,
                'inspectors' => $scanData ? implode(', ', $scanData['inspectors']) : '-',
                'latest_scan' => $scanData ? $scanData['latest_scan']->format('Y-m-d H:i') : '-'
            ];
        }

        foreach ($scanMap as $kode => $scanData) {
            $exists = false;
            foreach ($opname as $item) {
                if ($item->kode === $kode) {
                    $exists = true;
                    break;
                }
            }
            
            if (!$exists) {
                $processedData[] = [
                    'kode' => $kode,
                    'nama_barang' => 'BARANG TIDAK TERDAFTAR',
                    'stok_awal' => 0,
                    'masuk' => 0,
                    'keluar' => 0,
                    'sisa_opname' => 0,
                    'qty_scan' => $scanData['total_qty'],
                    'selisih' => $scanData['total_qty'],
                    'satuan' => '-',
                    'inspectors' => implode(', ', $scanData['inspectors']),
                    'latest_scan' => $scanData['latest_scan']->format('Y-m-d H:i')
                ];
            }
        }

        return $processedData;
    }
}