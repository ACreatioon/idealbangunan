<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index()
    {
        return Inertia::render('barang', [
            'products' => Product::orderBy('created_at', 'desc')->get()
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->update($request->only([
            'kode',
            'nama_barang',
            'lokasi',
            'harga_toko',
            'harga_khusus',
            'diskon'
        ]));

        return redirect()->back();
    }

    public function delete($id)
    {
        Product::findOrFail($id)->delete();

        return redirect()->back();
    }

    public function import(Request $request)
    {
        $items = $request->input('items', []);

        if (count($items) === 0) {
            return back()->withErrors('Data kosong');
        }

        $payload = collect($items)
            ->filter(fn($item) => !empty(trim($item['kode'] ?? '')))
            ->map(function ($item) {
                return [
                    'kode'          => trim($item['kode']),
                    'nama_barang'   => $item['nama_barang'] ?? '',
                    'lokasi'        => $item['lokasi'] ?? 'ALL',
                    'harga_toko'    => (int) ($item['harga_toko'] ?? 0),
                    'harga_khusus'  => (int) ($item['harga_khusus'] ?? 0),
                    'diskon'        => (int) ($item['diskon'] ?? 0),
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ];
            })
            ->toArray();

        Product::upsert(
            $payload,
            ['kode'],
            [
                'nama_barang',
                'lokasi',
                'harga_toko',
                'harga_khusus',
                'diskon',
                'updated_at',
            ]
        );

        return back()->with('success', 'Import produk berhasil');
    }


    public function deleteSelected(Request $request)
    {
        Product::whereIn('id', $request->ids)->delete();
    }

    public function deleteAll()
    {
        Product::truncate();
    }
}
