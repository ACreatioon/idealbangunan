<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class scanfisik extends Model
{
    protected $fillable = [
        'kode',
        'inspector',
        'qty',
    ];
}
