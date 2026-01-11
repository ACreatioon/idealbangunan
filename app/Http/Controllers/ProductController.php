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
        $request->validate([
            'items' => 'required|array'
        ]);

        foreach ($request->items as $item) {
            Product::updateOrCreate($item);
        }

        return back();
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
