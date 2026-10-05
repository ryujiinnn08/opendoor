<?php

namespace App\Models;

use App\Enums\MemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployerMember extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'employer_id', 'department_id', 'role'];

    protected function casts(): array
    {
        return [
            'role' => MemberRole::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function isOwner(): bool
    {
        return $this->role === MemberRole::Owner;
    }
}
