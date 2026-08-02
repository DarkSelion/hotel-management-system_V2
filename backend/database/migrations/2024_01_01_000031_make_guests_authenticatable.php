<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // Add auth columns to guests table
        Schema::table('guests', function (Blueprint $table) {
            $table->string('password')->nullable()->after('phone');
            $table->rememberToken()->after('password');
            $table->timestamp('email_verified_at')->nullable()->after('remember_token');
        });

        // Migrate existing portal user credentials into guests table
        $users = DB::table('users')->where('role', 'guest')->get();
        foreach ($users as $user) {
            if ($user->guest_id) {
                DB::table('guests')
                    ->where('id', $user->guest_id)
                    ->update([
                        'password' => $user->password,
                        'remember_token' => $user->remember_token,
                        'email_verified_at' => $user->email_verified_at,
                    ]);
            }
        }

        // Drop guest_id FK and column from users
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropColumn('guest_id');
        });

        // Delete old guest user rows from users table
        DB::table('users')->where('role', 'guest')->delete();
    }

    public function down(): void
    {
        // Add back guest_id to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('guest_id')->nullable()->constrained()->nullOnDelete()->after('role');
        });

        // Remove auth columns from guests
        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn(['password', 'remember_token', 'email_verified_at']);
        });
    }
};
