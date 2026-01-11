<?php

namespace App\Http\Controllers;

use App\Models\Opname;
use App\Models\Scanfisik;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\product;

class LaporanController extends Controller
{
    public function index()
    {
        try {
            $opname = Opname::query()
                ->leftJoin('products', 'products.kode', '=', 'opnames.kode')
                ->select([
                    'opnames.id',
                    'opnames.kode',
                    'opnames.nama_barang',
                    'opnames.stok_awal',
                    'opnames.masuk',
                    'opnames.keluar',
                    'opnames.satuan',
                    'products.harga_khusus'
                ])
                ->orderBy('opnames.kode')
                ->get();

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
            ]);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
