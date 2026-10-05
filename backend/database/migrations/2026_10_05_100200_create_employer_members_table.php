<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Connects a user to an employer as its owner or as an HR officer in a department.
     */
    public function up(): void
    {
        Schema::create('employer_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            // HR officers only; departments can't be deleted while they have members.
            $table->foreignId('department_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('role', 20); // owner | hr
            $table->timestamps();

            $table->index(['employer_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employer_members');
    }
};
