<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\MasterBarangController;
use App\Http\Controllers\OpnameController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ScanFisikController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('login')->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::get('/barang', [ProductController::class, 'index'])->name('barang');
    Route::get('/masterbarang', [MasterBarangController::class, 'index'])
        ->name('master-barang.index');

    Route::get('/stok/opname', [OpnameController::class, 'index'])->name('stok.opname');

    Route::get('/stok/scan-fisik', function () {
        return inertia('stok/scanFisik', [
            'data' => \App\Models\ScanFisik::orderBy('kode')->get()
        ]);
    });

    Route::get('/laporan', [LaporanController::class, 'index'])->name('laporan');
});

Route::post('/login', [AuthController::class, 'login'])->name('login')->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/master-barang/import', [MasterBarangController::class, 'import'])
        ->name('master-barang.import');
    Route::put('/masterbarang/{id}', [MasterBarangController::class, 'update']);
    Route::delete('/masterbarang/{id}', [MasterBarangController::class, 'delete']);
    Route::post('/masterbarang/delete-all', [MasterBarangController::class, 'deleteAll']);

    Route::put('/barang/{id}', [ProductController::class, 'update']);
    Route::delete('/barang/{id}', [ProductController::class, 'delete']);
    Route::post('/barang/import', [ProductController::class, 'import']);
    Route::post('/barang/delete-selected', [ProductController::class, 'deleteSelected']);
    Route::post('/barang/delete-all', [ProductController::class, 'deleteAll']);

    Route::post('/stok/opname', [OpnameController::class, 'store']);
    Route::post('/stok/opname/import', [OpnameController::class, 'import']);
    Route::put('/stok/opname/{id}', [OpnameController::class, 'update']);
    Route::delete('/stok/opname/{id}', [OpnameController::class, 'delete']);
    Route::post('/stok/opname/delete-selected', [OpnameController::class, 'deleteSelected']);
    Route::post('/stok/opname/delete-all', [OpnameController::class, 'deleteAll']);

    Route::delete('/stok/scan-fisik/{id}', [ScanFisikController::class, 'delete']);
    Route::put('/stok/scan-fisik/{id}', [ScanFisikController::class, 'update']);
    Route::post('/stok/scan-fisik/reset', [ScanFisikController::class, 'reset']);
    Route::post('/stok/scan-fisik/import', [ScanFisikController::class, 'import']);

    Route::get('/laporan/export', [LaporanController::class, 'exportExcel'])->name('laporan.export');
    Route::delete('/laporan/scan/{id}', [LaporanController::class, 'destroyScanFisik'])->name('laporan.scan.destroy');
});
