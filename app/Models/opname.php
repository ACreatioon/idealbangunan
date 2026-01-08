<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class opname extends Model
{
    use HasFactory;
    protected $fillable = [ 
        'kode',
        'nama_barang',
        'stok_awal',
        'masuk',
        'keluar',
        'satuan'
    ];
}
