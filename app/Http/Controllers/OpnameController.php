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

        return redirect()->route('stok.opname')->with('success', 'Opname berhasil di tambahkan');
    }

    public function import(Request $request)
    {
        // dd($request->all());
        $data = $request->input('data', []);

        foreach ($data as $row) {
            if (empty($row['kode'])) continue;

            Opname::updateOrCreate(
                ['kode' => $row['kode']],
                [
                    'nama_barang' => $row['nama_barang'],
                    'stok_awal' => (int) $row['stok_awal'],
                    'masuk'     => (int) $row['masuk'],
                    'keluar'    => (int) $row['keluar'],
                    'satuan'    => $row['satuan'],
                ]
            );
        }

        return back()->with('success', 'Data berhasil diimport');
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

        return redirect()->back()->with('success', 'Opname berhasil di update');
    }

    public function delete($id)
    {
        $opname = opname::findOrFail($id);
        $opname->delete();
        return redirect()->back()->with('success', 'Opname berhasil di hapus');
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
