<?php

namespace App\Http\Controllers;

use App\Models\ScanFisik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanFisikController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string'
        ]);

        ScanFisik::updateOrCreate(
            ['kode' => $request->kode],
            ['qty' => DB::raw('qty + 1')]
        );

        return redirect()->back()->with('success', 'Barang berhasil di scan');
    }

    public function delete($id)
    {
        ScanFisik::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Data scan fisik berhasil dihapus');
    }

    public function reset()
    {
        ScanFisik::truncate();

        return redirect()->back()->with('success', 'Data scan fisik berhasil direset');
    }
}
