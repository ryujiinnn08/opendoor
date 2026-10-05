<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Key/value platform settings managed by administrators.
 */
class AppSetting extends Model
{
    public const HR_PER_DEPARTMENT_CAP = 'hr_per_department_cap';

    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, mixed $default = null): mixed
    {
        return static::query()->find($key)?->value ?? $default;
    }

    public static function put(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => (string) $value]);
    }
}
