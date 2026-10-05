<?php

namespace Tests;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public const SPA_ORIGIN = 'http://localhost:5173';

    protected function setUp(): void
    {
        parent::setUp();

        // Behave like the React SPA so Sanctum starts a session for API requests.
        config(['sanctum.stateful' => ['localhost:5173']]);
        $this->withHeader('Origin', self::SPA_ORIGIN);
    }

    /**
     * Switching users within a test: forget the guards resolved for earlier requests,
     * otherwise Sanctum keeps returning the previous user (each real request starts fresh).
     */
    public function be(Authenticatable $user, $guard = null)
    {
        $this->app['auth']->forgetGuards();

        return parent::be($user, $guard);
    }
}
