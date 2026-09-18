<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Services\UserService;
use Illuminate\Http\Request;
use Exception;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index(Request $request)
    {
        // Authorization handled by middleware/gates in a real app,
        // but here we can just do a simple check or rely on FormRequest if it was a FormRequest.
        // For simple GET, we can keep the check or move it to a Request class.
        $this->authorizeAction($request);

        $users = $this->userService->getAllUsers();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function show(Request $request, $id)
    {
        $this->authorizeAction($request);

        $user = $this->userService->getUserById($id);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    public function store(UserRequest $request)
    {
        $user = $this->userService->createUser($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan',
            'data' => $user
        ], 201);
    }

    public function update(UserRequest $request, $id)
    {
        $user = $this->userService->updateUser($id, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diupdate',
            'data' => $user
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $this->authorizeAction($request);

        try {
            $this->userService->deleteUser($id, $request->user());
            
            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 403);
        }
    }

    private function authorizeAction(Request $request)
    {
        $role = strtolower($request->user()->role ?? '');
        $isAuthorized = str_contains($role, 'admin') || str_contains($role, 'superadmin') || str_contains($role, 'ketua');
        
        abort_unless($isAuthorized, 403, 'Unauthorized');
    }
}
