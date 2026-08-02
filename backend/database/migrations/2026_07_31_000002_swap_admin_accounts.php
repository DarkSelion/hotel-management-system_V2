<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->where('email', 'admin2@hotel.com')->delete();
    }

    public function down(): void
    {
        // Data cleanup is intentionally not reversed.
    }
};
