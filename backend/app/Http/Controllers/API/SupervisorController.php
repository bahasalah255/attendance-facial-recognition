<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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
        ]);

        $supervisor = Supervisor::create($request->all());

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
        ]);

        $supervisor->update($request->all());
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
}
