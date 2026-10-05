<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Job postings (plan PHASE_2 §4.1). Drafts may be incomplete, so most fields are nullable;
     * submitting needs every field. Deleted postings are kept (soft deletes).
     */
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employer_id')->constrained()->cascadeOnDelete();
            // Company postings only. Restrict keeps a department or category from being deleted
            // while any posting, even a deleted one, uses it (decision 32).
            $table->foreignId('department_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->restrictOnDelete();

            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('location', 150)->nullable();
            $table->string('employment_type', 20)->nullable(); // full_time | part_time | contract | internship
            $table->string('work_setup', 20)->nullable(); // on_site | hybrid | remote
            $table->string('interview_format', 20)->nullable(); // online | on_site | online_or_on_site
            // A whole day in Philippine time; the posting is open until the end of it.
            $table->date('closes_on')->nullable();

            $table->string('status', 20)->default('draft'); // draft | pending | open | rejected | closed
            $table->text('rejection_reason')->nullable();
            $table->timestamp('submitted_at')->nullable(); // orders the approval queue
            $table->timestamp('approved_at')->nullable(); // set once approved; drives "Changed after approval"

            $table->timestamps();
            $table->softDeletes();

            $table->index(['employer_id', 'status']);
            $table->index(['status', 'submitted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
