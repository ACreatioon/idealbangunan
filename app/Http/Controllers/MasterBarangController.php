<?php

namespace App\Http\Controllers;

use App\Models\Masterbarang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterBarangController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');

        $data = Masterbarang::query()
            ->when($search, function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                    ->orWhere('nama_barang', 'like', "%{$search}%");
            })
            ->orderBy('kode')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('masterbarang', [
            'masterbarangs' => $data,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }
    public function import(Request $request)
    {
        $items = $request->items ?? [];

        if (count($items) === 0) {
            return back()->withErrors('Data kosong');
        }

        foreach ($items as $item) {
            Masterbarang::updateOrCreate(
                ['kode' => $item['kode']],
                [
                    'nama_barang' => $item['nama_barang'],
                    'lokasi' => $item['lokasi'] ?? 'ALL',
                ]
            );
        }

        return back()->with('success', 'Import master barang berhasil');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama_barang' => 'required|string',
            'lokasi' => 'nullable|string',
        ]);

        $item = Masterbarang::findOrFail($id);
        $item->update([
            'nama_barang' => $request->nama_barang,
            'lokasi' => $request->lokasi ?? 'ALL',
        ]);

        return back()->with('success', 'Data berhasil diupdate');
    }

    public function delete($id)
    {
        Masterbarang::findOrFail($id)->delete();
        return back()->with('success', 'Data berhasil dihapus');
    }
}
