<?php

namespace Tests\Feature\Admin;

use App\Models\Accommodation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccommodationManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAs(User::factory()->admin()->create(), 'web');
    }

    public function test_admin_can_add_an_accommodation_type_with_a_new_group(): void
    {
        $this->postJson('/api/admin/accommodations', [
            'name' => 'Quiet workspace',
            'group_name' => 'Environment',
            'description' => 'A low-noise area to work in.',
        ])
            ->assertCreated()
            ->assertJsonPath('data.group_name', 'Environment')
            ->assertJsonPath('data.is_active', true);
    }

    public function test_admin_can_edit_an_accommodation_type(): void
    {
        $accommodation = Accommodation::factory()->create(['name' => 'Ramp']);

        $this->putJson("/api/admin/accommodations/{$accommodation->id}", [
            'name' => 'Wheelchair ramp',
            'group_name' => 'Physical access',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Wheelchair ramp');
    }

    public function test_name_and_group_are_required(): void
    {
        $this->postJson('/api/admin/accommodations', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'group_name']);
    }

    public function test_retired_types_leave_the_public_list_but_stay_in_the_admin_list(): void
    {
        $accommodation = Accommodation::factory()->create(['name' => 'Accessible parking']);

        $this->patchJson("/api/admin/accommodations/{$accommodation->id}/status", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->getJson('/api/accommodations')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Accessible parking']);

        $this->getJson('/api/admin/accommodations')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Accessible parking', 'is_active' => false]);
    }

    public function test_retired_types_can_be_restored(): void
    {
        $accommodation = Accommodation::factory()->retired()->create();

        $this->patchJson("/api/admin/accommodations/{$accommodation->id}/status", ['is_active' => true])
            ->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    public function test_there_is_no_delete_endpoint(): void
    {
        $accommodation = Accommodation::factory()->create();

        $this->deleteJson("/api/admin/accommodations/{$accommodation->id}")->assertMethodNotAllowed();
        $this->assertModelExists($accommodation);
    }

    public function test_public_list_is_grouped_in_the_ra_7277_order(): void
    {
        Accommodation::factory()->create(['name' => 'Job coach', 'group_name' => 'Support']);
        Accommodation::factory()->create(['name' => 'Ramp', 'group_name' => 'Physical access']);
        Accommodation::factory()->create(['name' => 'Quiet room', 'group_name' => 'Environment']);

        $this->getJson('/api/accommodations')
            ->assertOk()
            ->assertJsonPath('data.0.group', 'Physical access')
            ->assertJsonPath('data.0.accommodations.0.name', 'Ramp')
            ->assertJsonPath('data.1.group', 'Support')
            ->assertJsonPath('data.2.group', 'Environment');
    }
}
