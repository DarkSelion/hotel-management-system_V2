<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user');

        if ($module = $request->module) {
            $query->where('module', $module);
        }

        if ($action = $request->action) {
            $query->where('action', $action);
        }

        if ($userId = $request->user_id) {
            $query->where('user_id', $userId);
        }

        return response()->json(
            $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 10)
        );
    }
}
