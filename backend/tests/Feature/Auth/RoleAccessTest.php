<?php

namespace Tests\Feature\Auth;

use App\Models\Accommodation;
use App\Models\Category;
use App\Models\Employer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Every admin endpoint, as [method, uri].
     */
    private function adminEndpoints(): array
    {
        $category = Category::factory()->create();
        $accommodation = Accommodation::factory()->create();
        $employer = Employer::factory()->pendingVerification()->create();

        return [
            ['GET', '/api/admin/dashboard'],
            ['GET', '/api/admin/employers'],
            ['PATCH', "/api/admin/employers/{$employer->id}/verify"],
            ['GET', '/api/admin/settings'],
            ['PUT', '/api/admin/settings'],
            ['GET', '/api/admin/accommodations'],
            ['POST', '/api/admin/accommodations'],
            ['PUT', "/api/admin/accommodations/{$accommodation->id}"],
            ['PATCH', "/api/admin/accommodations/{$accommodation->id}/status"],
            ['POST', '/api/admin/categories'],
            ['PUT', "/api/admin/categories/{$category->id}"],
            ['DELETE', "/api/admin/categories/{$category->id}"],
        ];
    }

    #[DataProvider('nonAdminRoles')]
    public function test_non_admins_are_refused_on_every_admin_endpoint(string $state): void
    {
        $user = $state === 'candidate' ? User::factory()->create() : User::factory()->employer()->create();

        foreach ($this->adminEndpoints() as [$method, $uri]) {
            $this->actingAs($user, 'web')
                ->json($method, $uri)
                ->assertForbidden();
        }
    }

    public static function nonAdminRoles(): array
    {
        return ['candidate' => ['candidate'], 'employer' => ['employer']];
    }

    public function test_guests_are_refused_on_admin_endpoints(): void
    {
        foreach ($this->adminEndpoints() as [$method, $uri]) {
            $this->json($method, $uri)->assertUnauthorized();
        }
    }

    public function test_admins_can_reach_admin_endpoints(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'web')
            ->getJson('/api/admin/accommodations')
            ->assertOk();
    }

    public function test_job_seekers_and_admins_are_refused_on_employer_endpoints(): void
    {
        foreach ([User::factory()->create(), User::factory()->admin()->create()] as $user) {
            foreach ([['GET', '/api/employer/profile'], ['POST', '/api/employer/setup'], ['GET', '/api/employer/departments']] as [$method, $uri]) {
                $this->actingAs($user, 'web')->json($method, $uri)->assertForbidden();
            }
        }
    }
}
