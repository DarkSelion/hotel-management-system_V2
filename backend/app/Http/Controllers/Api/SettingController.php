<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');

        return response()->json(self::decorate($settings));
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|max:100',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'] ?? '', 'group' => self::groupForKey($setting['key'])]
            );
        }

        $settings = Setting::all()->pluck('value', 'key');

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => $settings,
        ]);
    }

    public static function groupForKey(string $key): string
    {
        if (str_starts_with($key, 'hotel_') || in_array($key, ['default_currency', 'timezone'])) {
            return 'hotel';
        }
        if (str_starts_with($key, 'contact_')) {
            return 'contact';
        }
        if (in_array($key, ['tax_name', 'tax_rate'])) {
            return 'tax';
        }
        if (in_array($key, ['password_min_length', 'session_timeout', 'max_login_attempts', 'two_factor_auth'])) {
            return 'security';
        }
        if (in_array($key, ['default_discount', 'cancellation_policy', 'max_advance_days', 'early_checkin_fee', 'late_checkout_fee'])) {
            return 'booking';
        }

        return 'general';
    }

    public function byGroup(string $group)
    {
        $settings = Setting::where('group', $group)->get()->pluck('value', 'key');

        return response()->json(self::decorate($settings));
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        $current = Setting::where('key', 'hotel_logo')->first();
        if ($current && $current->value) {
            Storage::disk('public')->delete($current->value);
        }

        $path = $request->file('logo')->store('branding', 'public');

        Setting::updateOrCreate(
            ['key' => 'hotel_logo'],
            ['value' => $path, 'group' => 'hotel']
        );

        return response()->json([
            'message' => 'Logo uploaded successfully.',
            'logo_url' => url('storage/' . ltrim($path, '/')),
        ]);
    }

    public function deleteLogo()
    {
        $current = Setting::where('key', 'hotel_logo')->first();
        if ($current && $current->value) {
            Storage::disk('public')->delete($current->value);
        }

        Setting::where('key', 'hotel_logo')->delete();

        return response()->json(['message' => 'Logo removed successfully.']);
    }

    protected static function decorate($settings)
    {
        if (!empty($settings['hotel_logo'])) {
            $settings['hotel_logo'] = url('storage/' . ltrim($settings['hotel_logo'], '/'));
        }

        return $settings;
    }
}
