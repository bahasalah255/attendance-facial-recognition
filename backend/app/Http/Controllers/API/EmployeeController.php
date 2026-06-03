<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\FaceData;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employes = Employee::with('shift')->get();
        return response()->json($employes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string|max:255',
            'position' => 'required|string',
            'department' => 'required|string',
            'shift_id' => 'required|exists:shifts,id',
            'hire_date' => 'required|date',
            'photos' => 'required|array|size:5',
            'photos.*' => 'string',
            'face_descriptors' => 'required|array|size:5',
            'face_descriptors.*' => 'array|size:128',
        ]);

        $photoPaths = $this->storePhotosFromDataUrls($request->input('photos', []));
        $faceDescriptors = $request->input('face_descriptors', []);

        $employe = Employee::create([
            'matricule' => Employee::generateMatricule(),
            'full_name' => $request->full_name,
            'photo' => $photoPaths[0] ?? null,
            'photos' => $photoPaths,
            'position' => $request->position,
            'department' => $request->department,
            'shift_id' => $request->shift_id,
            'hire_date' => $request->hire_date,
        ]);

        FaceData::updateOrCreate(
            [
                'user_id' => $employe->id,
                'user_type' => Employee::class,
            ],
            [
                'face_descriptors' => $faceDescriptors,
                'last_scan_time' => null,
            ]
        );

        return response()->json($employe->load('shift'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $employe = Employee::with(['shift', 'attendances', 'faceData'])->findOrfail($id);
        return response()->json($employe);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $employe = Employee::findOrfail($id);
         $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'position' => 'sometimes|string',
            'department' => 'sometimes|string',
            'shift_id' => 'sometimes|exists:shifts,id',
            'photos' => 'sometimes|array|max:5',
            'photos.*' => 'string',
            'face_descriptors' => 'sometimes|array|max:5',
            'face_descriptors.*' => 'array|size:128',
        ]);

        $data = $request->only([
            'full_name',
            'position',
            'department',
            'shift_id',
            'hire_date',
        ]);

        $newPhotos = $request->input('photos', []);

        if (!empty($newPhotos)) {
            $existingPhotos = array_values(array_filter($employe->photos ?? []));

            $storedPhotos = array_merge(
                $existingPhotos,
                $this->storePhotosFromDataUrls($newPhotos)
            );

            $storedPhotos = array_values(array_unique(array_filter($storedPhotos)));
            $storedPhotos = array_slice($storedPhotos, 0, 5);

            $data['photos'] = $storedPhotos;
            $data['photo'] = $storedPhotos[0] ?? $employe->photo;
        }

        if ($request->has('face_descriptors')) {
            $faceDescriptors = $request->input('face_descriptors', []);

            FaceData::updateOrCreate(
                [
                    'user_id' => $employe->id,
                    'user_type' => Employee::class,
                ],
                [
                    'face_descriptors' => $faceDescriptors,
                    'last_scan_time' => null,
                ]
            );
        }

        $employe->update($data);

        return response()->json($employe->fresh('shift'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $employe = Employee::findOrfail($id);
        $employe->delete();
        return response()->json(['message' => 'Employe Delete with Success']);
    }

    private function storePhotos(array $photos): array
    {
        return array_values(array_filter(array_map(function ($photo) {
            return $photo?->store('employees/photos', 'public');
        }, $photos)));
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

            $path = 'employees/photos/' . Str::uuid() . '-' . $index . '.' . $extension;
            Storage::disk('public')->put($path, $binary);

            return $path;
        }, $photos, array_keys($photos))));
    }
}
