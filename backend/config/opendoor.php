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

    // Address of the React app, used to build invite links.
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    /*
    |--------------------------------------------------------------------------
    | Company teams
    |--------------------------------------------------------------------------
    |
    | The platform cap is stored in app_settings once an admin changes it;
    | default_hr_cap is used until then.
    |
    */

    'teams' => [
        'default_hr_cap' => 10,
        'default_department_limit' => 3,
        'invite_lifetime_days' => 7,
        'first_department_name' => 'General',
    ],

    'seed' => [
        'admin_email' => env('SEED_ADMIN_EMAIL'),
        'admin_password' => env('SEED_ADMIN_PASSWORD'),
        'demo_password' => env('SEED_DEMO_PASSWORD'),
    ],

];
