<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('opnames', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama_barang')->nullable();
            $table->integer('stok_awal')->default(0);
            $table->integer('masuk')->default(0);
            $table->integer('keluar')->default(0);
            $table->string('satuan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opnames');
    }
};
