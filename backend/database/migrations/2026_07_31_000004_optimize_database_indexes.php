<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // reservations: covering composite for the room-scoped overlap check
        // (ReservationController::roomHasOverlap + reconcileRoomStatus)
        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasIndex('reservations', 'idx_res_room_status_dates')) {
                $table->index(['room_id', 'status', 'check_in', 'check_out'], 'idx_res_room_status_dates');
            }
        });

        Schema::table('reservations', function (Blueprint $table) {
            if (! Schema::hasIndex('reservations', 'idx_res_guest_created')) {
                $table->index(['guest_id', 'created_at'], 'idx_res_guest_created');
            }
        });

        // reservations: created_at used by report whereBetween + year-max numbering + admin index sort
        if (! Schema::hasIndex('reservations', 'idx_res_created_at')) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->index(['created_at'], 'idx_res_created_at');
            });
        }

        // payments: status equality + created_at range/sargable whereDate rewrite
        if (! Schema::hasIndex('payments', 'idx_payments_status_created_at')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'idx_payments_status_created_at');
            });
        }

        // rooms: covering composite for portal room pick by type
        // (room_type_id + status + is_active + ORDER BY floor, room_number)
        if (! Schema::hasIndex('rooms', 'idx_rooms_type_status_active_order')) {
            Schema::table('rooms', function (Blueprint $table) {
                $table->index(
                    ['room_type_id', 'status', 'is_active', 'floor', 'room_number'],
                    'idx_rooms_type_status_active_order'
                );
            });
        }

        // activity_logs: created_at ordering for recentActivities + module index sort
        if (! Schema::hasIndex('activity_logs', 'idx_activity_logs_created_at')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index(['created_at'], 'idx_activity_logs_created_at');
            });
        }

        // invoices: created_at used by the year-max numbering query (after sargable rewrite)
        if (! Schema::hasIndex('invoices', 'idx_invoices_created_at')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index(['created_at'], 'idx_invoices_created_at');
            });
        }
    }

    public function down(): void
    {
        foreach (['idx_res_room_status_dates', 'idx_res_guest_created', 'idx_res_created_at'] as $name) {
            Schema::table('reservations', function (Blueprint $table) use ($name) {
                if (Schema::hasIndex('reservations', $name)) {
                    $table->dropIndex($name);
                }
            });
        }

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasIndex('payments', 'idx_payments_status_created_at')) {
                $table->dropIndex('idx_payments_status_created_at');
            }
        });

        Schema::table('rooms', function (Blueprint $table) {
            if (Schema::hasIndex('rooms', 'idx_rooms_type_status_active_order')) {
                $table->dropIndex('idx_rooms_type_status_active_order');
            }
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            if (Schema::hasIndex('activity_logs', 'idx_activity_logs_created_at')) {
                $table->dropIndex('idx_activity_logs_created_at');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasIndex('invoices', 'idx_invoices_created_at')) {
                $table->dropIndex('idx_invoices_created_at');
            }
        });
    }
};
