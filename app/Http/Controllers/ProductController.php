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

    public function store(Request $request)
    {
        Product::create($request->only([
            'kode',
            'nama_barang',
            'lokasi',
            'harga_toko',
            'harga_dc',
            'harga_khusus',
            'diskon'
        ]));

        return redirect()->route('barang')->with('success', 'Barang berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $product->update($request->only([
            'kode',
            'nama_barang',
            'lokasi',
            'harga_toko',
            'harga_dc',
            'harga_khusus',
            'diskon'
        ]));

        return redirect()->back()->with('success', 'Barang berhasil diupdate');
    }

    public function delete($id)
    {
        Product::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Barang berhasil dihapus');
    }

    public function import(Request $request)
    {
        $request->validate([
            'items' => 'required|array'
        ]);

        foreach ($request->items as $item) {
            Product::create($item);
        }

        return back();
    }
}
