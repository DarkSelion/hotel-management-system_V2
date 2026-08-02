<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->boolean('is_overdue')->default(false)->after('payment_status');
            $table->timestamp('overdue_at')->nullable()->after('is_overdue');
            $table->foreignId('no_show_by')->nullable()->after('overdue_at');
        });
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            if (Schema::hasColumn('reservations', 'no_show_by')) {
                $table->dropForeign(['no_show_by']);
                $table->dropColumn('no_show_by');
            }
            if (Schema::hasColumn('reservations', 'is_overdue')) {
                $table->dropColumn('is_overdue');
            }
            if (Schema::hasColumn('reservations', 'overdue_at')) {
                $table->dropColumn('overdue_at');
            }
        });
    }
};
