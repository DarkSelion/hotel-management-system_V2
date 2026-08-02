<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query();

        if ($category = $request->category) {
            $query->where('category', $category);
        }

        if ($from = $request->from_date) {
            $query->where('date', '>=', $from);
        }

        if ($to = $request->to_date) {
            $query->where('date', '<=', $to);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->paginate($request->per_page ?? 10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'receipt' => 'nullable|string|max:255',
        ]);

        $data['created_by'] = $request->user()->id;

        $expense = Expense::create($data);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'created',
            'module' => 'expenses',
            'model_type' => 'Expense',
            'model_id' => $expense->id,
            'description' => "Created expense: " . ($expense->description ?? $expense->category) . " (₱" . number_format($expense->amount, 2) . ")",
        ]);

        return response()->json($expense, 201);
    }

    public function show(Expense $expense)
    {
        return response()->json($expense);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate([
            'category' => 'sometimes|string|max:100',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'sometimes|date',
            'receipt' => 'nullable|string|max:255',
        ]);

        $expense->update($data);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'updated',
            'module' => 'expenses',
            'model_type' => 'Expense',
            'model_id' => $expense->id,
            'description' => "Updated expense: " . ($expense->description ?? $expense->category),
        ]);

        return response()->json($expense);
    }

    public function destroy(Expense $expense)
    {
        $desc = $expense->description ?? $expense->category;
        $expense->delete();

        ActivityLog::create([
            'user_id' => request()->user()->id,
            'action' => 'deleted',
            'module' => 'expenses',
            'description' => "Deleted expense: {$desc}",
        ]);

        return response()->json(['message' => 'Expense deleted successfully.']);
    }
}
