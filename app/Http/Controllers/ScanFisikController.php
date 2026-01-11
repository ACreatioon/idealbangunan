<?php

namespace App\Http\Controllers;

use App\Models\ScanFisik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanFisikController extends Controller
{
    public function import(Request $request)
    {
        $items = $request->input('items', []);

        $payload = collect($items)
            ->filter(fn($i) => !empty($i['kode']) && !empty($i['inspector']))
            ->map(fn($i) => [
                'kode' => $i['kode'],
                'inspector' => $i['inspector'],
                'qty' => (int) ($i['qty'] ?? 0),
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->toArray();

        ScanFisik::upsert(
            $payload,
            ['kode', 'inspector'],
            [
                'qty' => DB::raw('qty + VALUES(qty)'),
                'updated_at',
            ]
        );

        return back()->with('success', 'Import scan fisik berhasil');
    }


    public function delete($id)
    {
        ScanFisik::findOrFail($id)->delete();

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'qty' => 'required|integer|min:1'
        ]);

        ScanFisik::where('id', $id)->update([
            'qty' => $request->qty
        ]);

        return back();
    }

    public function reset()
    {
        ScanFisik::truncate();

        return redirect()->back();
    }
}
