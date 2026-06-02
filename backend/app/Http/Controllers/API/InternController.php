<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Intern;

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
        ]);

        $intern = Intern::create($request->all());

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
        ]);

        $intern->update($request->all());
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
}
