<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function success(mixed $data, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json(['data' => $data, 'message' => $message], $code);
    }

    protected function error(string $message, int $code = 400, mixed $errors = null): JsonResponse
    {
        $response = ['message' => $message];
        if ($errors) $response['errors'] = $errors;
        return response()->json($response, $code);
    }

    protected function paginatedSuccess(mixed $data, string $message = 'Success'): JsonResponse
    {
        return response()->json($data);
    }
}
