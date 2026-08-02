<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecentActivitiesTest extends TestCase
{
    use RefreshDatabase;

    protected function admin(): User
    {
        $role = Role::create(['name' => 'Administrator', 'slug' => 'admin']);

        return User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
    }

    protected function createActivity(int $minutesAgo, ?User $user = null, string $module = 'reservations', string $action = 'created', ?string $description = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'description' => $description ?? "Test activity for {$module}",
            'created_at' => now()->subMinutes($minutesAgo),
        ]);
    }

    public function test_recent_activities_returns_activities_in_descending_order(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->createActivity(30, $admin, 'reservations', 'created');
        $this->createActivity(10, $admin, 'payments', 'created');
        $this->createActivity(5, $admin, 'guests', 'created');

        $response = $this->getJson('/api/dashboard/recent-activities');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            '*' => ['id', 'action', 'module', 'description', 'created_at'],
        ]);

        $data = $response->json();
        $this->assertCount(3, $data);
        // Verify ordering: most recent first
        $this->assertEquals('guests', $data[0]['module']);
        $this->assertEquals('payments', $data[1]['module']);
        $this->assertEquals('reservations', $data[2]['module']);
    }

    public function test_recent_activities_returns_max_10_activities(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        for ($i = 0; $i < 15; $i++) {
            $this->createActivity($i, $admin, 'reservations', 'created');
        }

        $response = $this->getJson('/api/dashboard/recent-activities');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(10, $data);
    }

    public function test_recent_activities_eager_loads_user_relation(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->createActivity(5, $admin, 'reservations', 'created');

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertArrayHasKey('user', $data[0]);
        $this->assertEquals($admin->id, $data[0]['user']['id']);
        $this->assertEquals($admin->name, $data[0]['user']['name']);
    }

    public function test_recent_activities_returns_empty_array_when_no_activities(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/dashboard/recent-activities');

        $response->assertStatus(200);
        $response->assertJson([]);
        $data = $response->json();
        $this->assertCount(0, $data);
    }

    public function test_recent_activities_requires_authentication(): void
    {
        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(401);
    }

    public function test_recent_activities_allows_staff_access(): void
    {
        $role = Role::create(['name' => 'Receptionist', 'slug' => 'receptionist']);
        $user = User::create([
            'name' => 'Staff User',
            'email' => 'staff@test.com',
            'password' => Hash::make('password'),
            'role_id' => $role->id,
            'is_active' => true,
        ]);
        Sanctum::actingAs($user);

        $this->createActivity(5, $user, 'guests', 'created');

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());
    }

    public function test_recent_activities_returns_correct_fields(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->createActivity(
            10,
            $admin,
            'housekeeping',
            'status_changed',
            'Housekeeping task marked as completed'
        );

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);

        $activity = $response->json()[0];
        $this->assertArrayHasKey('id', $activity);
        $this->assertArrayHasKey('user_id', $activity);
        $this->assertArrayHasKey('action', $activity);
        $this->assertArrayHasKey('module', $activity);
        $this->assertArrayHasKey('model_type', $activity);
        $this->assertArrayHasKey('model_id', $activity);
        $this->assertArrayHasKey('description', $activity);
        $this->assertArrayHasKey('created_at', $activity);
        $this->assertArrayHasKey('updated_at', $activity);

        $this->assertEquals('status_changed', $activity['action']);
        $this->assertEquals('housekeeping', $activity['module']);
        $this->assertEquals('Housekeeping task marked as completed', $activity['description']);
    }

    public function test_recent_activities_supports_multiple_modules(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->createActivity(10, $admin, 'reservations', 'created', 'Created reservation #BK-2024-0001');
        $this->createActivity(20, $admin, 'payments', 'created', 'Recorded payment of ₱12,500.00');
        $this->createActivity(30, $admin, 'guests', 'created', 'Added new guest Maria Garcia');
        $this->createActivity(40, $admin, 'housekeeping', 'status_changed', 'Housekeeping task marked as completed');
        $this->createActivity(50, $admin, 'maintenance', 'created', 'Reported maintenance: Leaking faucet');
        $this->createActivity(60, $admin, 'expenses', 'created', 'Created expense: Cleaning supplies');

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(6, $data);

        // Verify all modules are present
        $modules = array_column($data, 'module');
        $this->assertContains('reservations', $modules);
        $this->assertContains('payments', $modules);
        $this->assertContains('guests', $modules);
        $this->assertContains('housekeeping', $modules);
        $this->assertContains('maintenance', $modules);
        $this->assertContains('expenses', $modules);
    }

    public function test_recent_activities_includes_unclaimed_activities(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        // Create an activity with no user (system-generated)
        ActivityLog::create([
            'user_id' => null,
            'action' => 'auto_status_update',
            'module' => 'rooms',
            'description' => 'Room 101 status automatically updated',
            'created_at' => now()->subMinutes(5),
        ]);

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertNull($data[0]['user_id']);
    }

    public function test_recent_activities_returns_correctly_formatted_timestamps(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->createActivity(10, $admin, 'reservations');

        $response = $this->getJson('/api/dashboard/recent-activities');
        $response->assertStatus(200);

        $data = $response->json();
        $this->assertArrayHasKey('created_at', $data[0]);
        // Verify it's a valid timestamp format
        $this->assertNotEmpty($data[0]['created_at']);
    }
}
