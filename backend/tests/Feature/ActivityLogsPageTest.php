<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityLogsPageTest extends TestCase
{
    use RefreshDatabase;

    protected function userWithRole(string $slug, string $name = 'Admin User', string $email = 'admin@test.com'): User
    {
        $role = Role::create(['name' => ucfirst($slug), 'slug' => $slug]);

        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    protected function createActivity(?User $user, string $module, string $action, ?string $description = null, int $minutesAgo = 10): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'description' => $description ?? "Test activity for {$module}",
            'created_at' => now()->subMinutes($minutesAgo),
        ]);
    }

    public function test_index_returns_paginated_logs_with_user(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);

        $this->createActivity($admin, 'reservations', 'created', 'Created reservation #BK-1', 20);
        $this->createActivity($admin, 'payments', 'created', 'Recorded payment', 10);

        $response = $this->getJson('/api/activity-logs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'action', 'module', 'description', 'created_at', 'user'],
                ],
                'current_page',
                'last_page',
                'per_page',
                'total',
            ]);

        $this->assertCount(2, $response->json('data'));
        $this->assertEquals('payments', $response->json('data.0.module'));
        $this->assertEquals('Admin User', $response->json('data.0.user.name'));
    }

    public function test_module_action_filters_apply(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);

        $this->createActivity($admin, 'reservations', 'created');
        $this->createActivity($admin, 'payments', 'updated');
        $this->createActivity($admin, 'guests', 'deleted');

        $response = $this->getJson('/api/activity-logs?module=reservations&action=created');
        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('reservations', $response->json('data.0.module'));
        $this->assertEquals('created', $response->json('data.0.action'));
    }

    public function test_user_id_filter_applies(): void
    {
        $admin = $this->userWithRole('admin');
        $other = $this->userWithRole('receptionist', 'Receptionist', 'recep@test.com');
        Sanctum::actingAs($admin);

        $this->createActivity($admin, 'reservations', 'created');
        $this->createActivity($other, 'guests', 'created');

        $response = $this->getJson('/api/activity-logs?user_id='.$admin->id);
        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals($admin->id, $response->json('data.0.user.id'));
    }

    public function test_scope_staff_and_guest_filters_apply(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);

        $this->createActivity($admin, 'reservations', 'created');
        $this->createActivity(null, 'reservations', 'created', 'Guest Maria created reservation');

        $staffResponse = $this->getJson('/api/activity-logs?scope=staff');
        $staffResponse->assertOk();
        $this->assertCount(1, $staffResponse->json('data'));
        $this->assertNotNull($staffResponse->json('data.0.user_id'));
        $this->assertEquals($admin->id, $staffResponse->json('data.0.user.id'));

        $guestResponse = $this->getJson('/api/activity-logs?scope=guest');
        $guestResponse->assertOk();
        $this->assertCount(1, $guestResponse->json('data'));
        $this->assertNull($guestResponse->json('data.0.user_id'));
        $this->assertNull($guestResponse->json('data.0.user'));
    }

    public function test_search_filters_by_description_and_user_name(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);

        $this->createActivity($admin, 'reservations', 'created', 'Created reservation #BK-777');
        $this->createActivity($admin, 'payments', 'created', 'Recorded payment');

        $descResponse = $this->getJson('/api/activity-logs?search=BK-777');
        $descResponse->assertOk();
        $this->assertCount(1, $descResponse->json('data'));
        $this->assertStringContainsString('BK-777', $descResponse->json('data.0.description'));

        $userResponse = $this->getJson('/api/activity-logs?search=Admin%20User');
        $userResponse->assertOk();
        $this->assertCount(2, $userResponse->json('data'));
    }

    public function test_non_admin_is_forbidden(): void
    {
        $staff = $this->userWithRole('receptionist', 'Receptionist', 'recep@test.com');
        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/activity-logs');
        $response->assertStatus(403);
    }
}
