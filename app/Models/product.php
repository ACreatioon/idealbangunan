<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class product extends Model
{
    protected $fillable = [
        "kode",
        "nama_barang",
        "lokasi",
        "harga_toko",
        "harga_khusus",
        "diskon"
    ];
}
