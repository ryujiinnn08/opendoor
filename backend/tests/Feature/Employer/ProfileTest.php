<?php

namespace Tests\Feature\Employer;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\BuildsTeams;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use BuildsTeams, RefreshDatabase;

    public function test_owner_updates_the_company_profile(): void
    {
        [$owner] = $this->companyWithOwner();

        $this->actingAs($owner, 'web')->putJson('/api/employer/profile', [
            'name' => 'Acme Philippines Inc.',
            'industry' => 'Healthcare',
            'address' => 'Makati City',
            'description' => 'We make accessible medical devices.',
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Acme Philippines Inc.')
            ->assertJsonPath('data.description', 'We make accessible medical devices.');
    }

    public function test_hr_officers_can_view_but_not_change_the_company_or_see_registration_details(): void
    {
        [, $company, $department] = $this->companyWithOwner();
        $hr = $this->hrOfficerIn($department);

        $this->actingAs($hr, 'web')->getJson('/api/employer/profile')
            ->assertOk()
            ->assertJsonPath('data.name', $company->name)
            ->assertJsonMissingPath('data.verification');

        $this->putJson('/api/employer/profile', ['name' => 'Hacked', 'industry' => 'X', 'address' => 'Y'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Only the owner can change this profile.');
    }

    public function test_individual_employers_update_their_profile_without_an_industry(): void
    {
        [$individual] = $this->individualEmployer();

        $this->actingAs($individual, 'web')
            ->putJson('/api/employer/profile', ['name' => 'Rosa Reyes', 'address' => 'Davao City'])
            ->assertOk()
            ->assertJsonPath('data.type', 'individual')
            ->assertJsonPath('data.address', 'Davao City');
    }

    public function test_owner_uploads_replaces_and_removes_the_logo(): void
    {
        Storage::fake('local');
        [$owner, $company] = $this->companyWithOwner();

        $first = $this->actingAs($owner, 'web')
            ->post('/api/employer/profile/logo', ['logo' => UploadedFile::fake()->image('logo.png', 200, 200)], ['Accept' => 'application/json'])
            ->assertOk()
            ->json('data.logo_url');
        $firstPath = $company->fresh()->logo_path;
        Storage::disk('local')->assertExists($firstPath);
        $this->assertStringContainsString("/api/employers/{$company->id}/logo", $first);

        $this->get("/api/employers/{$company->id}/logo")->assertOk();

        $this->post('/api/employer/profile/logo', ['logo' => UploadedFile::fake()->image('new.jpg', 200, 200)], ['Accept' => 'application/json'])
            ->assertOk();
        Storage::disk('local')->assertMissing($firstPath);

        $this->deleteJson('/api/employer/profile/logo')->assertOk()->assertJsonPath('data.logo_url', null);
        $this->assertNull($company->fresh()->logo_path);
        $this->getJson("/api/employers/{$company->id}/logo")->assertNotFound();
    }

    public function test_logo_must_be_a_small_png_jpg_or_webp(): void
    {
        Storage::fake('local');
        [$owner] = $this->companyWithOwner();
        $this->actingAs($owner, 'web');

        $this->post('/api/employer/profile/logo', ['logo' => UploadedFile::fake()->create('logo.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['logo' => 'The logo must be a PNG, JPG or WebP image.']);

        $this->post('/api/employer/profile/logo', ['logo' => UploadedFile::fake()->image('big.png')->size(3000)], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['logo' => 'The logo must be smaller than 2 MB.']);
    }

    public function test_hr_officers_cannot_change_the_logo(): void
    {
        Storage::fake('local');
        [, , $department] = $this->companyWithOwner();

        $this->actingAs($this->hrOfficerIn($department), 'web')
            ->post('/api/employer/profile/logo', ['logo' => UploadedFile::fake()->image('logo.png')], ['Accept' => 'application/json'])
            ->assertForbidden();
    }
}
