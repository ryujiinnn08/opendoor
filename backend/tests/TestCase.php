<?php

namespace Tests;

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
}
