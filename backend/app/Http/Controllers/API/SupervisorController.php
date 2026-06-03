<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Supervisor;
use Illuminate\Http\Request;
use App\Models\FaceData;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupervisorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
         $supervisors = Supervisor::with('interns')->get();
        return response()->json($supervisors);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
         $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:supervisors',
            'phone' => 'required|string',
            'department' => 'required|string',
            'photos' => 'sometimes|array|size:5',
            'photos.*' => 'string',
            'face_descriptors' => 'sometimes|array|size:5',
            'face_descriptors.*' => 'array|size:128',
        ]);

        $photos = $request->input('photos', []);
        $photoPaths = [];

        if (!empty($photos)) {
            $photoPaths = $this->storePhotosFromDataUrls($photos);
        }

        $data = $request->only(['first_name', 'last_name', 'email', 'phone', 'department']);

        if (!empty($photoPaths)) {
            $data['photos'] = $photoPaths;
            $data['photo'] = $photoPaths[0] ?? null;
        }

        $supervisor = Supervisor::create($data);

        if ($request->has('face_descriptors')) {
            $faceDescriptors = $request->input('face_descriptors', []);

            FaceData::updateOrCreate(
                [
                    'user_id' => $supervisor->id,
                    'user_type' => Supervisor::class,
                ],
                [
                    'face_descriptors' => $faceDescriptors,
                    'last_scan_time' => null,
                ]
            );
        }

        return response()->json($supervisor, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
         $supervisor = Supervisor::with('interns')->findOrFail($id);
        return response()->json($supervisor);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        
        $supervisor = Supervisor::findOrFail($id);

        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:supervisors,email,' . $id,
            'phone' => 'sometimes|string',
            'department' => 'sometimes|string',
            'photos' => 'sometimes|array|max:5',
            'photos.*' => 'string',
            'face_descriptors' => 'sometimes|array|max:5',
            'face_descriptors.*' => 'array|size:128',
        ]);

        $data = $request->only(['first_name', 'last_name', 'email', 'phone', 'department']);

        $newPhotos = $request->input('photos', []);

        if (!empty($newPhotos)) {
            $existingPhotos = array_values(array_filter($supervisor->photos ?? []));

            $storedPhotos = array_merge(
                $existingPhotos,
                $this->storePhotosFromDataUrls($newPhotos)
            );

            $storedPhotos = array_values(array_unique(array_filter($storedPhotos)));
            $storedPhotos = array_slice($storedPhotos, 0, 5);

            $data['photos'] = $storedPhotos;
            $data['photo'] = $storedPhotos[0] ?? $supervisor->photo;
        }

        if ($request->has('face_descriptors')) {
            $faceDescriptors = $request->input('face_descriptors', []);

            FaceData::updateOrCreate(
                [
                    'user_id' => $supervisor->id,
                    'user_type' => Supervisor::class,
                ],
                [
                    'face_descriptors' => $faceDescriptors,
                    'last_scan_time' => null,
                ]
            );
        }

        $supervisor->update($data);
        return response()->json($supervisor);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
         $supervisor = Supervisor::findOrFail($id);
        $supervisor->delete();
        return response()->json(['message' => 'Encadrant supprimé avec succès']);
    }

    private function storePhotosFromDataUrls(array $photos): array
    {
        return array_values(array_filter(array_map(function ($photo, $index) {
            if (!is_string($photo) || !str_starts_with($photo, 'data:image/')) {
                throw ValidationException::withMessages([
                    'photos' => 'Chaque photo doit être une image base64 valide.',
                ]);
            }

            [$header, $encoded] = explode(',', $photo, 2) + [null, null];

            if (!$encoded) {
                throw ValidationException::withMessages([
                    'photos' => 'Le format de photo base64 est invalide.',
                ]);
            }

            preg_match('/data:image\/(\w+);base64/', $header ?? '', $matches);
            $extension = $matches[1] ?? 'jpg';
            $binary = base64_decode($encoded, true);

            if ($binary === false) {
                throw ValidationException::withMessages([
                    'photos' => 'Impossible de décoder une photo.',
                ]);
            }

            $path = 'supervisors/photos/' . Str::uuid() . '-' . $index . '.' . $extension;
            Storage::disk('public')->put($path, $binary);

            return $path;
        }, $photos, array_keys($photos))));
    }
}
