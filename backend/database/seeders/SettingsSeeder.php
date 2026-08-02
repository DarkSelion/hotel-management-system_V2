<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'hotel_name', 'value' => 'Pampanga Home Suites', 'group' => 'hotel'],
            ['key' => 'hotel_address', 'value' => 'Pampanga, Philippines', 'group' => 'hotel'],
            ['key' => 'hotel_phone', 'value' => '+63 912 345 6789', 'group' => 'hotel'],
            ['key' => 'hotel_email', 'value' => 'info@pampangahomesuites.com', 'group' => 'hotel'],
            ['key' => 'default_currency', 'value' => 'PHP', 'group' => 'hotel'],
            ['key' => 'timezone', 'value' => 'Asia/Manila', 'group' => 'hotel'],
            ['key' => 'tax_name', 'value' => 'VAT', 'group' => 'tax'],
            ['key' => 'tax_rate', 'value' => '10', 'group' => 'tax'],
            ['key' => 'default_discount', 'value' => '0', 'group' => 'booking'],
            ['key' => 'cancellation_policy', 'value' => 'Free cancellation up to 24 hours before check-in', 'group' => 'booking'],
            ['key' => 'max_advance_days', 'value' => '30', 'group' => 'booking'],
            ['key' => 'contact_heading', 'value' => 'Get in Touch', 'group' => 'contact'],
            ['key' => 'contact_description', 'value' => 'Have a question or special request? We would love to hear from you.', 'group' => 'contact'],
            ['key' => 'contact_reception_hours', 'value' => '24 / 7 — Always Open', 'group' => 'contact'],
            ['key' => 'contact_facebook', 'value' => '#', 'group' => 'contact'],
            ['key' => 'contact_instagram', 'value' => '#', 'group' => 'contact'],
            ['key' => 'contact_tiktok', 'value' => '#', 'group' => 'contact'],
            ['key' => 'contact_map_embed_url', 'value' => 'https://www.google.com/maps?q=Pampanga,+Philippines&output=embed', 'group' => 'contact'],
            ['key' => 'contact_faq', 'value' => json_encode([
                ['q' => 'What time is check-in and check-out?', 'a' => 'Thanks to our 24/7 reception, you can check in and check out at any time.'],
                ['q' => 'Do you offer airport transfers?', 'a' => 'Yes, we offer complimentary airport transfers for guests staying 3 nights or more. Contact our concierge to arrange your pickup.'],
                ['q' => 'Is breakfast included in the room rate?', 'a' => 'Breakfast is included with select room types. Please check your booking details or contact us for more information.'],
                ['q' => 'What is your cancellation policy?', 'a' => 'Free cancellation is available up to 24 hours before your scheduled check-in. Cancellations within 24 hours may be subject to a one-night charge.'],
            ]), 'group' => 'contact'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'group' => $setting['group']]
            );
        }
    }
}
