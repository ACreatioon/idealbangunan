<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class masterbarang extends Model
{
    protected $fillable = [
        "kode",
        "nama_barang",
        "lokasi",
    ];
}
