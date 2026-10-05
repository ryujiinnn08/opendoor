<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The hiring party: a company (with departments and HR officers) or an individual employer.
     */
    public function up(): void
    {
        Schema::create('employers', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20)->index(); // company | individual
            $table->string('name', 200);
            $table->string('industry', 100)->nullable();
            $table->string('address', 255)->nullable();
            $table->text('description')->nullable();
            $table->string('logo_path')->nullable();

            // Verification applies to companies only.
            $table->string('registration_type', 10)->nullable(); // dti | sec | cda
            $table->string('business_reg_no', 20)->nullable();
            $table->string('verification_status', 20)->default('not_submitted')->index();
            $table->timestamp('verification_submitted_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('verification_rejection_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employers');
    }
};
