<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'passport_number',
            'id_document_type',
            'id_document_number',
            'emergency_contact_name',
            'emergency_contact_phone',
        ];

        $existing = array_values(array_filter(
            $columns,
            fn (string $column) => Schema::hasColumn('guests', $column)
        ));

        if (count($existing) > 0) {
            Schema::table('guests', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }

    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->string('passport_number')->nullable()->after('date_of_birth');
            $table->string('id_document_type')->nullable()->after('passport_number');
            $table->string('id_document_number')->nullable()->after('id_document_type');
            $table->string('emergency_contact_name')->nullable()->after('address');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
        });
    }
};
