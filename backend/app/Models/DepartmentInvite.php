<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentInvite extends Model
{
    use HasFactory;

    protected $fillable = ['department_id', 'created_by', 'token_hash', 'expires_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Invites that can still be used. These count toward the department's places.
     */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now());
    }

    /**
     * Why the invite can't be used: 'used', 'revoked', 'expired', or null when it is still open.
     */
    public function closedReason(): ?string
    {
        return match (true) {
            $this->accepted_at !== null => 'used',
            $this->revoked_at !== null => 'revoked',
            $this->expires_at->isPast() => 'expired',
            default => null,
        };
    }
}
