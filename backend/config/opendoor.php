<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Seeded accounts
    |--------------------------------------------------------------------------
    |
    | Credentials for the administrator and demo accounts created by
    | `php artisan db:seed`. Outside production, blank values fall back to
    | the local defaults in UserSeeder. In production the admin values are
    | required, and demo accounts are created only when a demo password is set.
    |
    */

    'seed' => [
        'admin_email' => env('SEED_ADMIN_EMAIL'),
        'admin_password' => env('SEED_ADMIN_PASSWORD'),
        'demo_password' => env('SEED_DEMO_PASSWORD'),
    ],

];
