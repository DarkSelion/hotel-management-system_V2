<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function makeAdmin(bool $active = true): User
    {
        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => $active,
        ]);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        $this->makeAdmin(false);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(403);
    }

    public function test_deactivated_user_token_is_denied(): void
    {
        $admin = $this->makeAdmin(false);
        Sanctum::actingAs($admin);

        $this->getJson('/api/me')->assertStatus(403);
    }

    public function test_active_user_can_login(): void
    {
        $this->makeAdmin(true);

        $this->postJson('/api/login', [
            'email' => 'admin@test.com',
            'password' => 'password',
        ])->assertStatus(200);
    }

    public function test_public_admin_register_endpoint_is_removed(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Intruder',
            'email' => 'intruder@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(404);
    }
}
