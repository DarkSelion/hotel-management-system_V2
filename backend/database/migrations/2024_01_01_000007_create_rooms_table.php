<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('room_number')->unique();
            $table->foreignId('room_type_id')->constrained()->onDelete('cascade');
            $table->integer('floor');
            $table->string('status')->default('available');
            $table->string('cleaning_status')->default('clean');
            $table->decimal('price_override', 10, 2)->nullable();
            $table->integer('capacity');
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('status');
            $table->index('cleaning_status');
            $table->index('floor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
