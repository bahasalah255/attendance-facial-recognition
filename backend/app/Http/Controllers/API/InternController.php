<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Intern;
use App\Models\FaceData;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class InternController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $interns = Intern::with(['shift', 'supervisor'])->get();
        return response()->json($interns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'establishment' => 'required|string',
            'internship_type' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'duration' => 'required|integer',
            'supervisor_id' => 'required|exists:supervisors,id',
            'service' => 'required|string',
            'shift_id' => 'required|exists:shifts,id',
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

        $data = $request->only([
            'first_name', 'last_name', 'establishment', 'internship_type', 'start_date', 'end_date', 'duration', 'supervisor_id', 'service', 'shift_id'
        ]);

        if (!empty($photoPaths)) {
            $data['photos'] = $photoPaths;
            $data['photo'] = $photoPaths[0] ?? null;
        }

        $intern = Intern::create($data);

        if ($request->has('face_descriptors')) {
            $faceDescriptors = $request->input('face_descriptors', []);

            FaceData::updateOrCreate(
                [
                    'user_id' => $intern->id,
                    'user_type' => Intern::class,
                ],
                [
                    'face_descriptors' => $faceDescriptors,
                    'last_scan_time' => null,
                ]
            );
        }

        return response()->json($intern, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        
        $intern = Intern::with(['shift', 'supervisor', 'attendances', 'faceData'])->findOrFail($id);
        return response()->json($intern);
    
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
          $intern = Intern::findOrFail($id);
        $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'establishment' => 'sometimes|string',
            'internship_type' => 'sometimes|string',
            'supervisor_id' => 'sometimes|exists:supervisors,id',
            'shift_id' => 'sometimes|exists:shifts,id',
            'photos' => 'sometimes|array|max:5',
            'photos.*' => 'string',
            'face_descriptors' => 'sometimes|array|max:5',
            'face_descriptors.*' => 'array|size:128',
        ]);

        $data = $request->only([
            'first_name', 'last_name', 'establishment', 'internship_type', 'start_date', 'end_date', 'duration', 'supervisor_id', 'service', 'shift_id'
        ]);

        $newPhotos = $request->input('photos', []);

        if (!empty($newPhotos)) {
            $existingPhotos = array_values(array_filter($intern->photos ?? []));

            $storedPhotos = array_merge(
                $existingPhotos,
                $this->storePhotosFromDataUrls($newPhotos)
            );

            $storedPhotos = array_values(array_unique(array_filter($storedPhotos)));
            $storedPhotos = array_slice($storedPhotos, 0, 5);

            $data['photos'] = $storedPhotos;
            $data['photo'] = $storedPhotos[0] ?? $intern->photo;
        }

        if ($request->has('face_descriptors')) {
            $faceDescriptors = $request->input('face_descriptors', []);

            FaceData::updateOrCreate(
                [
                    'user_id' => $intern->id,
                    'user_type' => Intern::class,
                ],
                [
                    'face_descriptors' => $faceDescriptors,
                    'last_scan_time' => null,
                ]
            );
        }

        $intern->update($data);
        return response()->json($intern);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
          $intern = Intern::findOrFail($id);
        $intern->delete();
        return response()->json(['message' => 'Stagiaire supprimé avec succès']);
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

            $path = 'interns/photos/' . Str::uuid() . '-' . $index . '.' . $extension;
            Storage::disk('public')->put($path, $binary);

            return $path;
        }, $photos, array_keys($photos))));
    }
}
