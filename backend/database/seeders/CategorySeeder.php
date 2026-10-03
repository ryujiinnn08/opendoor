<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public const CATEGORIES = [
        'Information Technology',
        'Customer Service & BPO',
        'Administrative & Clerical',
        'Accounting & Finance',
        'Sales & Marketing',
        'Education & Training',
        'Healthcare',
        'Hospitality & Food Service',
        'Manufacturing & Production',
        'Creative & Design',
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $name) {
            Category::firstOrCreate(['name' => $name]);
        }
    }
}
