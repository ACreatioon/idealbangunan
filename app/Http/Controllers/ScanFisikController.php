<?php

namespace App\Http\Controllers;

use App\Models\ScanFisik;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanFisikController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'items' => 'required|array'
        ]);

        foreach ($request->items as $item) {
            ScanFisik::updateOrCreate(
                [
                    'kode' => $item['kode'],
                    'inspector' => $item['inspector']
                ],
                [
                    'qty' => DB::raw('qty + ' . (int)$item['qty'])
                ]
            );
        }

        return back();
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
