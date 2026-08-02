<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoomImageResource;
use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomImageController extends Controller
{
    public function index(Room $room)
    {
        $images = $room->images()->orderBy('sort_order')->orderBy('created_at')->get();

        return response()->json(RoomImageResource::collection($images));
    }

    public function store(Request $request, Room $room)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:4096',
            'caption' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
        ]);

        $path = $request->file('image')->store("rooms/{$room->id}", 'public');

        $maxOrder = $room->images()->max('sort_order') ?? 0;

        $image = $room->images()->create([
            'image_path' => $path,
            'caption' => $request->caption,
            'sort_order' => $maxOrder + 1,
            'is_primary' => $request->boolean('is_primary', false),
        ]);

        if ($image->is_primary) {
            $room->images()
                ->where('id', '!=', $image->id)
                ->update(['is_primary' => false]);
        }

        return response()->json(new RoomImageResource($image), 201);
    }

    public function update(Request $request, Room $room, RoomImage $image)
    {
        $request->validate([
            'caption' => 'nullable|string|max:255',
            'is_primary' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $image->update($request->only(['caption', 'sort_order', 'is_primary']));

        if ($request->boolean('is_primary')) {
            $room->images()
                ->where('id', '!=', $image->id)
                ->update(['is_primary' => false]);
        }

        return response()->json(new RoomImageResource($image->fresh()));
    }

    public function destroy(Room $room, RoomImage $image)
    {
        Storage::disk('public')->delete($image->image_path);

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully.']);
    }
}
