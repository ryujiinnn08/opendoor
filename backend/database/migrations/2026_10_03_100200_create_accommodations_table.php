<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            // Named group_name because GROUP is a reserved word in MySQL/MariaDB.
            $table->string('group_name', 50)->index();
            $table->text('description')->nullable();
            // Retired types are hidden from forms but kept for existing postings and feedback.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodations');
    }
};
