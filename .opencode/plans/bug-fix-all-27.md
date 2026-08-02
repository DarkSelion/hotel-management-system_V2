# Bug Fix Plan — 27 Issues (4 Phases)

## Phase 1 — Critical Fixes (4 bugs)

### Bug 1: Role Middleware Mismatch
**File:** `backend/app/Http/Middleware/EnsureUserHasRole.php:18`

**Current (line 18):**
`$userRole = $user->role->name ?? $user->role ?? '';`

**Replace with:**
`$slug = $user->role?->slug ?? $user->role ?? '';`
`$roleMap = ['super_admin' => 'admin', 'hotel_manager' => 'admin', 'staff' => 'staff', 'guest' => 'guest'];`
`$userRole = $roleMap[$slug] ?? $slug;`

**Why:** Seeded role slugs are super_admin, hotel_manager, staff, guest. Route middleware expects admin or staff.

---

### Bug 2: Tax Rate Always 0%
**File:** `backend/app/Http/Controllers/api/ReservationController.php:93,167`

**Current:** `$taxRate = ((float)(Setting::where('key', 'tax_rate')->value('value') ?? '12')) / 100;`

**Replace with:**
`$taxSetting = Setting::where('key', 'tax_rate')->first();`
`$taxRate = ((float)($taxSetting ? $taxSetting->getRawOriginal('value') : '10')) / 100;`

**Why:** Setting model casts value as array. getRawOriginal bypasses the cast.

---

### Bug 3: InvoiceItem NOT NULL Violations
**File:** `backend/app/Http/Controllers/api/InvoiceController.php:72-74, 101-103`

**Before createMany, map items:**
`$items = array_map(function ($item) {`
`    $item['total_price'] = ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);`
`    $item['type'] = $item['type'] ?? 'service';`
`    return $item;`
`}, $data['items']);`
`$invoice->items()->createMany($items);`

**Why:** total_price and type are NOT NULL but never sent by frontend.

---

### Bug 4: Download Button Triggers Send
**File:** `frontend/src/pages/InvoicesPage.tsx:358`

**Current:** `onClick={() => setSendConfirmId(r.id)}`
**Replace:** `onClick={() => handleDownloadPdf(r.id)}`

---

## Phase 2 — High Fixes (5 bugs)

### Bug 5: Portal Login 401 Redirect
**File:** `frontend/src/lib/portalApi.ts:26-29`

**Current:** `window.location.href = '/portal/login'`
**Replace:** `throw new Error('Session expired. Please log in again.')`

---

### Bug 6: Export Download 401
**File:** `frontend/src/pages/ReportsPage.tsx:120-127`

Replace `window.open()` with `fetch()` using Bearer token auth header, then blob download.

---

### Bug 7: Edit Invoice Hardcoded Tax
**File:** `frontend/src/pages/InvoicesPage.tsx:158-159`

**Current:** `tax_percent: 12, discount_percent: 0`
**Replace:** `tax_percent: invoice.tax_percent ?? 12, discount_percent: invoice.discount_percent ?? 0`

---

### Bug 8: Missing Invoice Invalidation
**File:** `frontend/src/hooks/useApi.ts:311-313`

Add `queryClient.invalidateQueries({ queryKey: ['invoices'] })` to useCreatePayment and useDeletePayment onSuccess.

---

### Bug 9: Room Type Pre-selection
**File:** `frontend/src/pages/portal/PortalBookingPage.tsx`

Read `room_type` from searchParams and pre-filter rooms list.

---

## Phase 3 — Medium Fixes (12 bugs)

### Bug 10: SettingController group NOT NULL
Add `'group' => $setting['group'] ?? 'general'` to updateOrCreate.

### Bug 11: completed_by Column Missing
Remove `$updates['completed_by']` from HousekeepingController and MaintenanceController.

### Bug 12: cancelled_by/cancelled_at Columns Missing
Remove from ReservationController and Portal/ReservationController update arrays.

### Bug 13: review_notes Column Missing
Remove from StaffController validation and $data.

### Bug 14: Amenities Never Synced
Add `$room->amenities()->sync($data['amenities'])` after create/update in RoomController.

### Bug 15: 5 Inline toLocaleDateString in GuestsPage
Replace with `formatDateDisplay()`.

### Bug 16: 2 Inline toLocaleDateString in HousekeepingPage
Replace with `formatDateDisplay()`.

### Bug 17: Hardcoded ? Sign
Replace with `formatCurrency()` in GuestsPage, RoomsPage, and others.

### Bug 18: Estimated Cost Dead UI
Include `estimated_cost` in MaintenancePage assign mutation payload.

### Bug 19: Navigation During Render
Move navigate into useEffect in PortalBookingPage.

### Bug 20: Missing Type Fields
Add `department?: string` to User, `created_at?: string` to MaintenanceRequest.

### Bug 21: Duplicate notes Validation
Remove duplicate key from HousekeepingController store/update.

---

## Phase 4 — Low Cleanup (6 bugs)

### Bug 22: 15 Remaining type="date"
Replace with `<DatePicker>` in ReportsPage (8), StaffPage (2), GuestsPage (1), PortalHomePage (2), PortalBookingPage (2).

### Bug 23: as any Casts
Fix type definitions to eliminate 13 casts.

### Bug 24: Portal Token Expiry
Add JWT expiry check in portalApi interceptor.

### Bug 25: Portal Register Redirect
Redirect to URL from searchParams after registration.

### Bug 26: Invoice Items Without Transaction
Wrap delete + createMany in DB::transaction().

### Bug 27: RoomType image Field
Remove 'image' from validation (no DB column).

---

## Verification
1. npm run build — zero TS errors
2. Admin login works (no 403)
3. Tax rate reads as 10%
4. Invoice creation with items succeeds
5. Download button downloads PDF, not sends
