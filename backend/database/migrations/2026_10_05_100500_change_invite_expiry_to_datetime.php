<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * On MariaDB/MySQL with explicit_defaults_for_timestamp off (XAMPP's MariaDB 10.4 default),
     * the first NOT NULL TIMESTAMP column silently gets "ON UPDATE CURRENT_TIMESTAMP", so an
     * invite's expiry was overwritten whenever the row changed. DATETIME never auto-updates.
     *
     * Rule for future migrations: required date columns use dateTime(), not timestamp().
     */
    public function up(): void
    {
        Schema::table('department_invites', function (Blueprint $table) {
            $table->dateTime('expires_at')->change();
        });
    }

    public function down(): void
    {
        Schema::table('department_invites', function (Blueprint $table) {
            $table->timestamp('expires_at')->change();
        });
    }
};
