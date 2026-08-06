<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('guests', 'is_vip')) {
            Schema::table('guests', function (Blueprint $table) {
                $table->dropColumn('is_vip');
            });
        }

        if (!Schema::hasColumn('guests', 'blacklist_reason')) {
            Schema::table('guests', function (Blueprint $table) {
                $table->text('blacklist_reason')->nullable()->after('is_blacklisted');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('guests', 'is_vip')) {
            Schema::table('guests', function (Blueprint $table) {
                $table->boolean('is_vip')->default(false);
            });
        }

        if (Schema::hasColumn('guests', 'blacklist_reason')) {
            Schema::table('guests', function (Blueprint $table) {
                $table->dropColumn('blacklist_reason');
            });
        }
    }
};
