<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;

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
        ]);
        $employe = Employee::create([
             'matricule' => Employee::generateMatricule(),
            'full_name' => $request->full_name,
            'photo' => $request->photo,
            'position' => $request->position,
            'department' => $request->department,
            'shift_id' => $request->shift_id,
            'hire_date' => $request->hire_date,
        ]);
        return response()->json($employee, 201);
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
        ]);
        $employe->update($request->all());
        return response()->json($employe);
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
}
