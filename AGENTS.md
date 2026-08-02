## Project: Pampanga Home Suites (rebranded from Grand Luxe Hotel)

**Type**: Small hotel (~15 rooms) in Pampanga, Philippines
**Amenities**: Swimming pool, Restaurant, Free Wi-Fi, Free Parking, Event Hall
**Domains**: Portal (frontend/public) + Admin (internal management)

### Branding decisions
- Portal is fully rebranded to "Pampanga Home Suites" — cozy, warm, homey tone
- Admin login (`LoginPage.tsx`) still uses "Grand Luxe Hotel" — for internal admin branding
- Portal navbar shows "Pampanga Home Suites" with "Home Suites" tagline
- Footer: Pampanga, Philippines | +63 912 345 6789 | info@pampangahomesuites.com

### Key code review fixes applied
- C1: Room double-booking race condition — overlap check in PortalReservationController::store
- C2: Active-reservation check before account deletion
- C3: Setting value cast fix (removed array cast)
- C4: input-dark → input-portal + htmlFor/id on PortalBookingPage
- C5: CSV export path injection fix — whitelist validation
- W1: Rate limiting on auth endpoints
- W2: Admin login restricted to non-guest roles
- W3: Portal tax rate reads from Setting
- W4: Fixed any type in PortalMyReservationsPage
- W5: Portal registration wrapped in DB transaction
- S10: Guest email synced with user email on profile update
- S6/S7: PortalBookingPage accessibility + null guard

### UI/UX fixes
- Hero section: h-screen + w-full + overflow-hidden + z-0 on slider images
- Booking widget moved up (bottom-0 → bottom-12)
- "Discover Our World" section polished with gentler tone

### Rebranding (current session)
- PortalHomePage: hero text, TAB_DATA, amenities, gallery, about section, stats
- PortalLoginPage, PortalRegisterPage: titles, brand links, copyright
- PortalNavbar: brand name + tagline
- PortalFooter: description, address, contact details, copyright
- PortalContactPage: section subtitle, contact card
- PortalGalleryPage: section subtitle, description
- SettingsSeeder: hotel_name, address, phone, email, contact info
- Contact info consolidated to `hotel_*` settings: portal contact page + footer read `hotel_address`/`hotel_phone`/`hotel_email` via `useHotelSettings()`; removed duplicate `contact_address`/`contact_phone`/`contact_email` inputs (Contact tab) + seeder rows. Admin General Settings: the Address/Phone/Email inputs now live in the **Contact tab** (section "Address & Contact Details") while the keys stay `hotel_address`/`hotel_phone`/`hotel_email` stored in the `hotel` group (backend `groupForKey()` routes `hotel_*` → hotel by key regardless of which tab saves them). Hotel tab keeps Hotel Name + Default Currency + Timezone
- Portal Contact page: "Reservations" card (was `contact_reservation_hours` "Mon — Sun: 8:00 AM — 10:00 PM") removed. Reception Hours (24/7) card retained. Check-in/Check-out times removed entirely (reception is 24/7): `check_in_time`/`check_out_time` settings + General Settings fields + portal card all removed; FAQ "What time is check-in and check-out?" reworded to "Thanks to our 24/7 reception, you can check in and check out at any time." (both default and seeded `contact_faq`). `contact_reservation_hours` input + seeder row removed; `groupForKey()` no longer maps `check_in_time`/`check_out_time`
- Hotel logo (`hotel_logo`): file upload via `POST/DELETE /settings/logo` (admin-only) → stored on `public` disk under `branding/`, path saved in settings (`hotel` group). `SettingController::index`/`byGroup` decorate `hotel_logo` into a full `/storage/...` URL. Shown in PortalNavbar (falls back to gold diamond) + InvoicesPage invoice header (which now reads `hotel_name`/`hotel_address`/`hotel_phone`/`hotel_email` via `useHotelSettings()` instead of the stale "Grand Hotel" text). Requires `php artisan storage:link` (done)
- Max advance booking days (`max_advance_days`, `booking` group, default 30, 0 = unlimited): new field in Settings Booking tab; portal DateRangePicker (PortalHomePage) + check-in DatePicker (PortalBookingPage) pass `max = today + N`; enforced server-side in PortalReservationController::store
- `contact_map_embed_url` seeder default fixed from fake Makati City pb-URL to `https://www.google.com/maps?q=Pampanga,+Philippines&output=embed` (admin can paste an exact embed URL via Contact tab → Map)
- Contact form now works: `POST /portal/contact` (public, `throttle:contact` = 3/hour per IP via named limiter in `AppServiceProvider`) stores messages in `contact_messages` (name, email, subject, message, ip_address). Honeypot `website` field: filled → returns 201 but silently drops. Admin-only `GET/DELETE /api/contact-messages` feed the **Inquiries** page (Sidebar, admin-only) — DataTable list, detail modal (Reply opens Gmail compose draft prefilled), delete. `contact_twitter` setting renamed to `contact_tiktok` (Settings Contact tab + portal "Follow Us" link). Portal form: 2-min post-send button cooldown + friendly 429 message (portalApi errors carry `status`/`retryAfter`).
- Portal booking now books **by room type** (`room_type_id`), not a specific room: `PortalReservationController::store` auto-assigns the first available room of that type inside the DB transaction (avoids stale-room races). Rate = `room_type.base_price`; Step 3 shows "Room assigned at check-in". `PortalBookingPage` Step 2 groups available rooms by type into one card per type (real `image_url`, description, features, "N rooms left" badge, price/night + total).
- UserSeeder: all staff email domains
- ActivityLogSeeder: admin email reference

### RBAC refinement (current session)
- `User::roleSlug()` reads the `role()` relation (never the shadowed legacy `role` column)
- `EnsureUserHasRole`: `super_admin|admin|hotel_manager → 'admin'`, `receptionist|housekeeping|cashier|staff → 'staff'`, Guest → `'guest'`
- `StaffController::store` uses `roleSlug()`; tiered creation limits (manager/admin can't create above their tier)
- Admin-only routes: Staff, Expenses, Reports, Settings, Activity Logs, Room Images, Room Types, Rooms POST/PUT/DELETE + status override, Guests DELETE, Housekeeping DELETE, Maintenance update/destroy/status/assign
- Operational (all staff): Guests index/store/show/update/history, Housekeeping CRUD minus delete + assign/status, Maintenance index/store/show, Rooms GET + `PUT /rooms/{room}/status`
- New `GET /staff/assignable` (active staff id+name) — operational, for assign dropdowns (avoids admin-only `GET /staff`)
- Frontend `isAdminRole(role)` helper gates UI: Guests delete button, Housekeeping delete, Maintenance assign/status/quick actions, Rooms status override dropdown
- Note: `users.role` legacy column is all `'staff'`; canonical role lives in `role_id → roles.slug`

### Architecture: User / Guest split
- **`guests` table** — portal/customer accounts. Stores profile + auth (password, remember_token). Authenticatable via Sanctum. HasMany reservations, payments, invoices.
- **`users` table** — staff/admin accounts only. No more `guest_id` FK or guest user rows. Role-based permissions via `roles` table.
- Portal registration creates 1 record in `guests` (no more dual Guest+User creation). Seeded guests get password `password`.
- Admin login no longer filters `role != 'guest'` — `users` table is staff-only.
- Middleware checks `$user instanceof Guest` to assign `'guest'` role; staff users use the existing role map.
- `Reservation`, `Payment`, `Invoice` models keep `guest_id` FK and `guest()` relationship pointing to `guests` table. Portal ReservationController uses `$request->user()` (returns Guest) directly rather than `$user->guest`.
- Frontend PortalUser type flattened — `first_name`, `last_name`, `phone` are top-level fields, no more `guest?` wrapper.

### Bug-fix session (current)
- **Test suite added**: `backend/tests/Feature/{AuthAccess,ReservationIntegrity,InvoicePayment,GuestDeletion}Test.php` (14 feature tests, SQLite in-memory). Run `php artisan test` (16 total green).
- Migration `2024_01_01_000032` made idempotent — guards `dropColumn` behind `Schema::hasColumn` (was failing fresh-DB migrations; the `guests` create migration no longer has those columns).
- `is_active` now enforced: `AuthController::login` (403) + `EnsureUserHasRole` (403) for deactivated staff.
- Public admin `POST /api/register` removed (route + `AuthController::register` method deleted) — no public staff self-registration.
- Admin `ReservationController::store`/`update`: overlap check via `roomHasOverlap()` (excludes `cancelled`/`checked_out`/`no_show`), rejects double-booking a room; `reconcileRoomStatus()`/`applyRoomState()` free/dirty/reserve rooms correctly on cancel, status-change-to-cancelled, room reassignment (also used by `cancel()` and `destroy()`).
- `InvoiceController::update` paid-status sums `invoices.total_amount` (was summing `paid_amount`, always 0 → zeroed reservation `paid_amount`).
- Guest/account deletion now blocked when **any** reservation history exists (admin `GuestController::destroy` + portal `destroyAccount`) — prevents cascading financial records.
- Portal `PaymentController::store`: rejects payments on `cancelled`/`checked_out`/`no_show` reservations; `payment_type` no longer accepts `refund` (guests can't self-refund).
- New `POST /portal/logout` (revokes current guest Sanctum token); admin `Navbar` now calls `POST /logout` on sign-out (token revocation, not just store clear).
- `config/sanctum.php` `expiration` = `SANCTUM_TOKEN_EXPIRATION` env (default 24h) — access tokens expire server-side.
- PDF invoices: installed `barryvdh/laravel-dompdf`; `InvoiceController::exportPdf` renders `resources/views/invoices/pdf.blade.php` (reads `hotel_*` settings, ₱ via DejaVu). Frontend: `downloadFile()` in `src/lib/api.ts` + `useDownloadInvoicePdf` triggers a real download.
- `portalApi.ts`: removed 403 JWT-format sniff (any 403 logged guests out — Sanctum tokens aren't JWTs); error messages now surface validation `errors` text.
- `PortalBookingPage`: error toast on confirm failure (was empty catch), `check_out > check_in` client validation + disabled button + error text, `nights` no longer clamped to 1 (bogus totals), `room_type` URL param pre-selects the room group, check-out date min = check-in + 1 day.
- Review follow-ups (code-reviewer + test-master pass): admin `ReservationController::update` now also checks overlap when **dates change** (not just room change) — `test_admin_cannot_extend_dates_over_existing_booking`. `InvoiceController::update` recomputes reservation `paid_amount`/`payment_status` on **any** status change (not only `paid`), so un-marking a paid invoice reverts totals — `test_unmarking_paid_invoice_reverts_reservation_paid_amount`. `PortalBookingPage` `maxDate`/`minCheckOut` use a local-date formatter (`toLocalDateStr`) instead of UTC `toISOString()` (off-by-one in Asia/Manila mornings). `InvoicesPage` shows a toast when PDF download fails.

### Test suite status
- **Backend tests**: 138 total (63 original + 75 new portal tests), all passing
- **PortalTest.php** created with 75 comprehensive tests covering:
  - **Auth**: Registration (3), Login (5), Me/Logout (2), Profile update (4), Password update (3), Delete account (2)
  - **Rooms**: List/availability (4), Detail by slug (3), Available rooms (4)
  - **Reservations**: Create (8), List (3), Show (2), Cancel (5)
  - **Payments**: Create (8)
  - **Contact**: Submit (5)
  - **Settings**: Public settings (3)
  - **RBAC Isolation**: Staff blocked from guest routes (1), activity logging (2), password change flow (1), room rebooking after cancel (1)
  - **Test utilities**: Helper methods for guest, roomType, room, settings, and reservation creation with dynamic dates

### DB optimization session
- **Migration `2026_07_31_000004_optimize_database_indexes`** — 7 new composite/indexes (idempotent via `Schema::hasIndex`):
  - `reservations(room_id, status, check_in, check_out)` — admin overlap + reconcile
  - `reservations(guest_id, created_at)` — portal "my reservations" sort
  - `reservations(created_at)` — report whereBetween + year-max
  - `payments(status, created_at)` — dashboard/report revenue aggregations
  - `rooms(room_type_id, status, is_active, floor, room_number)` — portal room pick by type (covering, eliminates filesort)
  - `activity_logs(created_at)` — recentActivities ordering
  - `invoices(created_at)` — year-max numbering
- **Sargable rewrites** performed across 7 controllers (replaced 13 `whereDate` + 4 `whereYear` + 1 `whereMonth` calls with explicit boundaries); unlocks index use for payment range queries, check-in/out date equality, and date-range scans.
- **Per-day occupancy loops collapsed** — Dashboard + Report + Export occupancy now fetch overlapping reservations in 1 query and compute daily counts in PHP (was N queries per day, e.g. 30 for dashboard).
- **Baseline evidence** (`EXPLAIN` on dev MySQL): after migration + rewrites, key queries switched from `type=ALL` to range/ref scans using new indexes (todayRevenue → `idx_payments_status_created_at` range, check-ins today → check_in index ref, coverage scan via composite). Several remain full-scan due to tiny data (2 payments, 6 reservations) — optimizer prefers scan; structurally correct for growth.
- **Verification**: 18 tests green (SQLite, assertions=35), frontend lint + build clean, smoke test of all refactored endpoints returns correct shape.

### Admin UI / Dashboard redesign (current session)
- `LoginPage.tsx`: admin login rebranded "Grand Luxe Hotel" → **Pampanga Home Suites** / **Admin Dashboard** / **Hotel Management System**; removed dead `Forgot Password?` placeholder link.
- `StatCard.tsx`: redesigned stat cards to SaaS-dashboard style — removed colored borders (per-accent `border`/`shadow` dropped), unified neutral `border-gray-200` + white bg + `shadow-sm`, `rounded-xl` (12px); color now lives on the icon background only; tighter `p-4`, smaller uppercase label, larger bold value, trend indicators (green up / red down).
- `components/charts/RevenueChart.tsx` (new extracted component): modern Revenue Overview — white card `rounded-2xl` (16px) with light neutral border + subtle shadow; smooth curved area chart (`type="natural"`) with soft blue gradient fill; horizontal-only subtle gridlines; no axis lines/ticklines; custom branded hover tooltip; animated line drawing on load (`animationDuration={1200}`); revenue summary bar (period total + % change vs prior period with trend icon); modern pill toggles (Revenue/Bookings) with per-tab totals; subtitle help text.
  - `DashboardPage.tsx`: all cards/sections restyled to `rounded-2xl border-gray-200 bg-white shadow-sm` for a clean, minimal, neutral look (Stripe/Linear/Vercel style); Revenue Overview migrated to `RevenueChart` component (replaces inline chart).
  - `Sidebar.tsx`: complete redesign to modern SaaS dashboard style — regrouped flat `menuItems` into 6 labeled sections (Overview, Hotel, Operations, Finance, Reports, Settings); active item now uses soft amber bg (`#fff7ed`) + 3px gold left accent bar + `rounded-xl` + shadow-sm; hover animation with `translate-x-1` + 150ms transition; submenu redesigned (removed vertical `border-l-2`, uses `ml-6` indentation with softer text); logo area updated to "Pampanga Home Suites" with subtitle "Hotel Management System" and `Building` icon; bottom section retains **Logout** button (red danger style) + collapse toggle only — user profile section (avatar/initials/name/role) removed to avoid duplication with Navbar; new CSS custom properties for sidebar palette in `src/index.css`; collapsed state shows tooltips on hover; all 13 menu items mapped into grouped structure (Staff moved from inline list into Settings > Staff)
