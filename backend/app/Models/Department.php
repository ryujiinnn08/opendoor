<?php

namespace App\Models;

use App\Enums\MemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'member_limit'];

    protected function casts(): array
    {
        return [
            'member_limit' => 'integer',
        ];
    }

    public function employer(): BelongsTo
    {
        return $this->belongsTo(Employer::class);
    }

    public function hrOfficers(): HasMany
    {
        return $this->hasMany(EmployerMember::class)->where('role', MemberRole::Hr);
    }

    public function invites(): HasMany
    {
        return $this->hasMany(DepartmentInvite::class);
    }
}
