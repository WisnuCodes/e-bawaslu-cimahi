<?php

namespace App\Services;

use App\Repositories\UserRepository;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Exception;

class UserService
{
    protected UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getAllUsers()
    {
        return $this->userRepository->getAllUsersWithDivisi();
    }

    public function getUserById(int|string $id)
    {
        return $this->userRepository->findById($id);
    }

    public function createUser(array $data)
    {
        $password = $data['password'] ?? 'Bawaslu123';

        $userData = [
            'user_id' => (string) Str::uuid(),
            'username' => $data['username'],
            'email' => $data['email'],
            'whatsapp_number' => $data['whatsapp_number'] ?? null,
            'password_hash' => Hash::make($password),
            'role' => $data['role'],
            'divisi_id' => $data['divisi_id'] ?? null,
            'tps_id' => $data['tps_id'] ?? null,
            'status_aktif' => $data['status_aktif'] ?? true,
            'mfa_enabled' => false
        ];

        $user = $this->userRepository->create($userData);
        $this->userRepository->invalidateCache();
        return $user;
    }

    public function updateUser(int|string $id, array $data)
    {
        $user = $this->userRepository->findById($id);

        $updateData = [];

        $optionalFields = ['username', 'email', 'whatsapp_number', 'role', 'divisi_id', 'tps_id'];
        foreach ($optionalFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (isset($data['status_aktif'])) {
            $updateData['status_aktif'] = $data['status_aktif'];
        }
        
        if (!empty($data['password'])) {
            $updateData['password_hash'] = Hash::make($data['password']);
        }

        $updatedUser = $this->userRepository->update($user, $updateData);
        $this->userRepository->invalidateCache();
        return $updatedUser;
    }

    public function deleteUser(int|string $id, User $requestingUser)
    {
        $user = $this->userRepository->findById($id);
        
        // Prevent deleting yourself
        if ($requestingUser->user_id === $user->user_id) {
            throw new Exception('Tidak dapat menghapus akun sendiri.');
        }

        $this->userRepository->delete($user);
        $this->userRepository->invalidateCache();
    }
}
