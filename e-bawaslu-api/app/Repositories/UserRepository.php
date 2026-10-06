<?php

namespace App\Repositories;

use App\Models\User;

use Illuminate\Support\Facades\Cache;

class UserRepository
{
    public function getAllUsersWithDivisi()
    {
        return User::leftJoin('divisi', 'users.divisi_id', '=', 'divisi.divisi_id')
            ->select('users.*', 'divisi.nama_divisi')
            ->orderBy('users.created_at', 'desc')
            ->get();
    }

    public function invalidateCache()
    {
        Cache::forget('users_all_with_divisi');
    }

    public function findById(int|string $id)
    {
        return User::findOrFail($id);
    }

    public function create(array $data)
    {
        return User::create($data);
    }

    public function update(User $user, array $data)
    {
        $user->update($data);
        return $user;
    }

    public function delete(User $user)
    {
        $user->delete();
    }
}
