<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The accommodations a posting provides, each with an optional note for job seekers.
     */
    public function up(): void
    {
        Schema::create('job_posting_accommodation', function (Blueprint $table) {
            $table->foreignId('job_posting_id')->constrained()->cascadeOnDelete();
            // Accommodation types are retired, never deleted.
            $table->foreignId('accommodation_id')->constrained()->restrictOnDelete();
            $table->string('note', 255)->nullable();

            $table->primary(['job_posting_id', 'accommodation_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posting_accommodation');
    }
};
