<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_requests', 'assigned_to')) {
                $table->dropForeign(['assigned_to']);
            }
        });

        // Old values referenced users; null them out before repointing.
        DB::table('maintenance_requests')->whereNotNull('assigned_to')->update(['assigned_to' => null]);

        Schema::table('maintenance_requests', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_requests', 'assigned_to')) {
                $table->foreign('assigned_to')->references('id')->on('technicians')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_requests', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_requests', 'assigned_to')) {
                $table->dropForeign(['assigned_to']);
            }
        });

        Schema::table('maintenance_requests', function (Blueprint $table) {
            if (Schema::hasColumn('maintenance_requests', 'assigned_to')) {
                $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
            }
        });
    }
};
