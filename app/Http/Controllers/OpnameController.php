<?php

namespace App\Http\Controllers;

use App\Models\opname;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OpnameController extends Controller
{
    public function index()
    {
        return Inertia::render('stok/opname', [
            'opname' => opname::orderBy('created_at', 'desc')->get()
        ]);
    }

    public function store(Request $request)
    {
        opname::create($request->only([
            'kode',
            'nama_barang',
            'stok_awal',
            'masuk',
            'keluar',
            'satuan'
        ]));

        return redirect()->route('stok.opname');
    }

    public function import(Request $request)
    {
        $data = $request->input('data', []);

        if (count($data) === 0) {
            return back()->withErrors('Data kosong');
        }

        $payload = collect($data)
            ->filter(fn($row) => !empty(trim($row['kode'] ?? '')))
            ->map(function ($row) {
                return [
                    'kode'        => trim($row['kode']),
                    'nama_barang' => $row['nama_barang'] ?? '',
                    'stok_awal'   => (int) ($row['stok_awal'] ?? 0),
                    'masuk'       => (int) ($row['masuk'] ?? 0),
                    'keluar'      => (int) ($row['keluar'] ?? 0),
                    'satuan'      => $row['satuan'] ?? '',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ];
            })
            ->toArray();

        Opname::upsert(
            $payload,
            ['kode'],
            [
                'nama_barang',
                'stok_awal',
                'masuk',
                'keluar',
                'satuan',
                'updated_at',
            ]
        );

        return back()->with('success', 'Import opname berhasil');
    }


    public function update(Request $request, $id)
    {
        $opname = Opname::findOrFail($id);

        $opname->update($request->only([
            'kode',
            'nama_barang',
            'stok_awal',
            'masuk',
            'keluar',
            'satuan'
        ]));

        return redirect()->back();
    }

    public function delete($id)
    {
        $opname = opname::findOrFail($id);
        $opname->delete();
        return redirect()->back();
    }

    public function deleteSelected(Request $request)
    {
        Opname::whereIn('id', $request->ids)->delete();
    }

    public function deleteAll()
    {
        Opname::truncate();
    }
}
