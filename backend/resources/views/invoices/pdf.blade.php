<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1f2937;
            font-size: 11px;
            margin: 0;
            padding: 0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #b8860b;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }
        .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #b8860b;
            letter-spacing: 1px;
            margin: 0 0 4px 0;
        }
        .brand-sub { color: #6b7280; font-size: 10px; line-height: 1.5; margin: 0; }
        .doc-title {
            text-align: right;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #b8860b;
            font-size: 14px;
            font-weight: bold;
        }
        .doc-number { text-align: right; font-size: 10px; color: #6b7280; margin-top: 2px; }
        .meta { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
        .meta-box { width: 48%; }
        .meta-box h4 { margin: 0 0 6px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; }
        .meta-box p { margin: 2px 0; color: #374151; line-height: 1.5; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.items th {
            background: #f3f4f6;
            text-align: left;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 1px;
            color: #6b7280;
            padding: 8px;
            border-bottom: 2px solid #b8860b;
        }
        table.items td { padding: 8px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        table.items td.num, table.items th.num { text-align: right; }
        .totals { width: 240px; margin-left: auto; }
        .totals .row { display: flex; justify-content: space-between; padding: 3px 0; color: #374151; }
        .totals .grand { font-weight: bold; font-size: 13px; border-top: 2px solid #b8860b; margin-top: 4px; padding-top: 6px; color: #111827; }
        .footer {
            margin-top: 24px;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
            line-height: 1.6;
        }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-draft { background: #f3f4f6; color: #6b7280; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        .notes { margin-top: 12px; padding: 10px; background: #f9fafb; border-left: 3px solid #b8860b; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <p class="brand-name">{{ $hotel['hotel_name'] ?? 'Pampanga Home Suites' }}</p>
            <p class="brand-sub">{{ $hotel['hotel_address'] ?? '' }}</p>
            <p class="brand-sub">{{ $hotel['hotel_phone'] ?? '' }}{{ !empty($hotel['hotel_phone']) && !empty($hotel['hotel_email']) ? '  |  ' : '' }}{{ $hotel['hotel_email'] ?? '' }}</p>
        </div>
        <div>
            <p class="doc-title">Invoice</p>
            <p class="doc-number">{{ $invoice->invoice_number }}</p>
            <p class="doc-number" style="margin-top: 6px;">
                <span class="status-badge status-{{ strtolower($invoice->status) }}">{{ strtoupper($invoice->status) }}</span>
            </p>
        </div>
    </div>

    <div class="meta">
        <div class="meta-box">
            <h4>Billed To</h4>
            <p>{{ $invoice->guest->first_name }} {{ $invoice->guest->last_name }}</p>
            @if($invoice->guest->email)<p>{{ $invoice->guest->email }}</p>@endif
            @if($invoice->guest->phone)<p>{{ $invoice->guest->phone }}</p>@endif
            @if($invoice->guest->address)<p>{{ $invoice->guest->address }}</p>@endif
        </div>
        <div class="meta-box">
            <h4>Invoice Details</h4>
            <p>Reservation: {{ $invoice->reservation->reservation_number }}</p>
            <p>Issued: {{ $invoice->issued_date?->format('M d, Y') }}</p>
            <p>Due: {{ $invoice->due_date?->format('M d, Y') }}</p>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width:55%">Description</th>
                <th style="width:15%" class="num">Qty</th>
                <th style="width:15%" class="num">Unit Price</th>
                <th style="width:15%" class="num">Total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoice->items as $item)
                <tr>
                    <td>{{ $item->description }}</td>
                    <td class="num">{{ $item->quantity }}</td>
                    <td class="num">₱{{ number_format($item->unit_price, 2) }}</td>
                    <td class="num">₱{{ number_format($item->total_price, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align:center; color:#9ca3af;">No line items.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="totals">
        <div class="row"><span>Subtotal</span><span>₱{{ number_format($invoice->amount, 2) }}</span></div>
        @if((float) $invoice->discount_amount > 0)
            <div class="row"><span>Discount</span><span>−₱{{ number_format($invoice->discount_amount, 2) }}</span></div>
        @endif
        <div class="row"><span>Tax</span><span>₱{{ number_format($invoice->tax_amount, 2) }}</span></div>
        <div class="row"><span>Amount Paid</span><span>₱{{ number_format($invoice->paid_amount, 2) }}</span></div>
        <div class="row grand"><span>Total</span><span>₱{{ number_format($invoice->total_amount, 2) }}</span></div>
    </div>

    @if($invoice->notes)
        <div class="notes">
            <strong>Notes:</strong> {{ $invoice->notes }}
        </div>
    @endif

    <div class="footer">
        Thank you for staying with us.<br>
        This invoice was generated by the {{ $hotel['hotel_name'] ?? 'Pampanga Home Suites' }} front desk.
    </div>
</body>
</html>
