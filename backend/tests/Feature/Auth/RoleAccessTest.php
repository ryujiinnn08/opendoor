<?php

namespace Tests\Feature\Auth;

use App\Models\Accommodation;
use App\Models\Category;
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

        return [
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
}
