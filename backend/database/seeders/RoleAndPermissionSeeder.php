<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            'dashboard', 'reservations', 'guests', 'rooms',
            'housekeeping', 'maintenance', 'billing', 'payments',
            'reports', 'staff', 'inventory', 'settings',
        ];

        $actions = ['view', 'create', 'edit', 'delete'];

        $allPermissions = [];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                $name = "{$module}_{$action}";
                $slug = "{$module}_{$action}";
                $permission = Permission::firstOrCreate(
                    ['slug' => $slug],
                    ['name' => $name, 'module' => $module]
                );
                $allPermissions[] = $permission;
            }
        }

        $permissionMap = [];
        foreach ($allPermissions as $p) {
            $permissionMap[$p->slug] = $p;
        }

        $superAdmin = Role::firstOrCreate(
            ['slug' => 'super_admin'],
            ['name' => 'Super Admin', 'description' => 'Full system access']
        );
        $superAdmin->permissions()->sync(collect($allPermissions)->pluck('id'));

        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'System administrator with operational control']
        );
        $adminSlugs = collect($allPermissions)->pluck('slug')
            ->reject(fn($s) => in_array($s, ['settings_delete']))
            ->toArray();
        $admin->permissions()->sync(
            collect($adminSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );

        $hotelManager = Role::firstOrCreate(
            ['slug' => 'hotel_manager'],
            ['name' => 'Hotel Manager', 'description' => 'Manages hotel operations']
        );
        $hotelManagerSlugs = collect($allPermissions)->pluck('slug')
            ->reject(fn($s) => in_array($s, ['settings_delete', 'staff_delete']))
            ->toArray();
        $hotelManager->permissions()->sync(
            collect($hotelManagerSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );

        $receptionistSlugs = [
            'dashboard_view',
            'reservations_view', 'reservations_create', 'reservations_edit',
            'guests_view', 'guests_create', 'guests_edit',
            'rooms_view', 'rooms_create', 'rooms_edit',
            'billing_view',
        ];
        $receptionist = Role::firstOrCreate(
            ['slug' => 'receptionist'],
            ['name' => 'Receptionist', 'description' => 'Front desk reception']
        );
        $receptionist->permissions()->sync(
            collect($receptionistSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );

        $housekeepingSlugs = [
            'dashboard_view',
            'rooms_view',
            'housekeeping_view', 'housekeeping_create', 'housekeeping_edit',
        ];
        $housekeepingRole = Role::firstOrCreate(
            ['slug' => 'housekeeping'],
            ['name' => 'Housekeeping', 'description' => 'Housekeeping staff']
        );
        $housekeepingRole->permissions()->sync(
            collect($housekeepingSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );

        $cashierSlugs = [
            'dashboard_view',
            'billing_view', 'billing_create',
            'payments_view', 'payments_create',
        ];
        $cashier = Role::firstOrCreate(
            ['slug' => 'cashier'],
            ['name' => 'Cashier', 'description' => 'Handles payments and billing']
        );
        $cashier->permissions()->sync(
            collect($cashierSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );

        $staffSlugs = [
            'dashboard_view',
            'reservations_view',
            'guests_view',
        ];
        $staff = Role::firstOrCreate(
            ['slug' => 'staff'],
            ['name' => 'Staff', 'description' => 'General staff member']
        );
        $staff->permissions()->sync(
            collect($staffSlugs)->map(fn($s) => $permissionMap[$s]->id)
        );
    }
}
