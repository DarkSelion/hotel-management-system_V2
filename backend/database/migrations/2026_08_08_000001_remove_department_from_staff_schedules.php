<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_schedules', function (Blueprint $table) {
            if (Schema::hasIndex('staff_schedules', 'staff_schedules_department_index')) {
                $table->dropIndex('staff_schedules_department_index');
            }
        });

        Schema::table('staff_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('staff_schedules', 'department')) {
                $table->dropColumn('department');
            }
        });
    }

    public function down(): void
    {
        Schema::table('staff_schedules', function (Blueprint $table) {
            if (! Schema::hasColumn('staff_schedules', 'department')) {
                $table->string('department')->nullable();
                $table->index('department');
            }
        });
    }
};
