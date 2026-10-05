<?php

namespace App\Models;

use App\Enums\EmployerType;
use App\Enums\MemberRole;
use App\Enums\RegistrationType;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Employer extends Model
{
    use HasFactory;

    protected $fillable = ['type', 'name', 'industry', 'address', 'description'];

    protected $attributes = [
        'verification_status' => 'not_submitted',
    ];

    protected function casts(): array
    {
        return [
            'type' => EmployerType::class,
            'registration_type' => RegistrationType::class,
            'verification_status' => VerificationStatus::class,
            'verification_submitted_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function members(): HasMany
    {
        return $this->hasMany(EmployerMember::class);
    }

    public function owner(): HasOne
    {
        return $this->hasOne(EmployerMember::class)->where('role', MemberRole::Owner);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class)->orderBy('name');
    }

    public function isCompany(): bool
    {
        return $this->type === EmployerType::Company;
    }

    public function isVerified(): bool
    {
        return $this->verification_status === VerificationStatus::Verified;
    }

    public function logoUrl(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        // The version changes with each upload, so browsers never show a stale logo.
        return url("/api/employers/{$this->id}/logo").'?v='.substr(md5($this->logo_path), 0, 8);
    }
}
