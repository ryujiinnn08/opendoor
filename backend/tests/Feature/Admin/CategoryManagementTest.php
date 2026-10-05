<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\JobPosting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->admin()->create(), 'web');
    }

    public function test_admin_can_add_a_category(): void
    {
        $this->postJson('/api/admin/categories', ['name' => '  Logistics  '])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Logistics');

        $this->assertDatabaseHas('categories', ['name' => 'Logistics']);
    }

    public function test_admin_can_rename_a_category(): void
    {
        $category = Category::factory()->create(['name' => 'IT']);

        $this->putJson("/api/admin/categories/{$category->id}", ['name' => 'Information Technology'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Information Technology');
    }

    public function test_renaming_a_category_to_its_own_name_is_allowed(): void
    {
        $category = Category::factory()->create(['name' => 'Healthcare']);

        $this->putJson("/api/admin/categories/{$category->id}", ['name' => 'Healthcare'])->assertOk();
    }

    public function test_duplicate_names_are_rejected(): void
    {
        Category::factory()->create(['name' => 'Healthcare']);

        $this->postJson('/api/admin/categories', ['name' => 'Healthcare'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name' => 'A category with this name already exists.']);
    }

    public function test_admin_can_delete_a_category(): void
    {
        $category = Category::factory()->create();

        $this->deleteJson("/api/admin/categories/{$category->id}")->assertNoContent();

        $this->assertModelMissing($category);
    }

    public function test_categories_used_by_postings_cannot_be_deleted(): void
    {
        $category = Category::factory()->create(['name' => 'Healthcare']);
        JobPosting::factory()->create(['category_id' => $category->id])->delete();

        $this->deleteJson("/api/admin/categories/{$category->id}")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['category' => '"Healthcare" is used by job postings, so it can\'t be deleted. Rename it instead.']);
        $this->assertModelExists($category);
    }

    public function test_public_list_is_alphabetical(): void
    {
        Category::factory()->create(['name' => 'Sales']);
        Category::factory()->create(['name' => 'Accounting']);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Accounting')
            ->assertJsonPath('data.1.name', 'Sales');
    }
}
