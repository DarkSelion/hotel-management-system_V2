<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Map old duplicate @grandluxe.com user IDs to the new @hotel.com accounts
        $oldToNew = [
            1 => 9,  // Super Admin
            2 => 11, // Hotel Manager
            3 => 12, // Receptionist
            4 => 13, // Housekeeping
            5 => 14, // Cashier
            6 => 15, // Staff
        ];

        $tables = [
            'activity_logs' => ['user_id'],
            'housekeeping_tasks' => ['assigned_to', 'created_by', 'inspected_by'],
            'maintenance_requests' => ['reported_by', 'assigned_to'],
            'staff_schedules' => ['user_id'],
            'leave_requests' => ['user_id', 'approved_by'],
            'expenses' => ['created_by', 'approved_by'],
            'reservations' => ['created_by', 'confirmed_by', 'checked_in_by', 'checked_out_by'],
            'payments' => ['processed_by'],
            'invoices' => ['created_by'],
            'purchase_orders' => ['ordered_by', 'received_by'],
            'user_activity_log' => ['user_id'],
        ];

        foreach ($tables as $table => $columns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($columns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    continue;
                }

                foreach ($oldToNew as $oldId => $newId) {
                    DB::table($table)->where($column, $oldId)->update([$column => $newId]);
                }
            }
        }

        DB::table('users')->whereIn('id', array_keys($oldToNew))->delete();
    }

    public function down(): void
    {
        // Data cleanup is intentionally not reversed.
    }
};
