<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OpnameController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ScanFisikController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

//ROUTE GET
Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('login')->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/barang', [ProductController::class, 'index'])->name('barang');

    Route::get('/stok/opname', [OpnameController::class, 'index'])->name('stok.opname');

    Route::get('/stok/scan-fisik', function () {
        return inertia('stok/scanFisik', [
            'data' => \App\Models\ScanFisik::orderBy('kode')->get()
        ]);
    });
    
});

// POST ROUTE
Route::post('/login', [AuthController::class, 'login'])->name('login')->middleware('guest');

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::middleware(['auth', 'role'])->group(function () {
    Route::post('/barang', [ProductController::class, 'store']);
    Route::put('/barang/{id}', [ProductController::class, 'update']);
    Route::delete('/barang/{id}', [ProductController::class, 'delete']);

    Route::post('/stok/opname', [OpnameController::class, 'store']);
    Route::post('/stok/opname/import', [OpnameController::class, 'import']);
    Route::put('/stok/opname/{id}', [OpnameController::class, 'update']);
    Route::delete('/stok/opname/{id}', [OpnameController::class, 'delete']);

    Route::post('/stok/scan-fisik', [ScanFisikController::class, 'store']);
    Route::delete('/stok/scan-fisik/{id}', [ScanFisikController::class, 'delete']);
    Route::post('/stok/scan-fisik/reset', [ScanFisikController::class, 'reset']);
});
