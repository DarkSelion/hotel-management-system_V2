<?php

namespace Database\Seeders;

use App\Models\Guest;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class GuestSeeder extends Seeder
{
    public function run(): void
    {
        $guests = [
            ['first_name' => 'James', 'last_name' => 'Smith', 'email' => 'james.smith@email.com', 'phone' => '+1-202-555-0147', 'nationality' => 'American', 'date_of_birth' => '1985-03-15', 'gender' => 'male', 'address' => '100 Main St', 'city' => 'New York', 'country' => 'USA', 'postal_code' => '10001', 'is_blacklisted' => false],
            ['first_name' => 'Maria', 'last_name' => 'Garcia', 'email' => 'maria.garcia@email.com', 'phone' => '+1-310-555-0182', 'nationality' => 'Mexican', 'date_of_birth' => '1990-07-22', 'gender' => 'female', 'address' => '456 Oak Ave', 'city' => 'Los Angeles', 'country' => 'USA', 'postal_code' => '90001', 'is_blacklisted' => false],
            ['first_name' => 'Chen', 'last_name' => 'Wei', 'email' => 'chen.wei@email.com', 'phone' => '+86-10-5555-0147', 'nationality' => 'Chinese', 'date_of_birth' => '1988-11-03', 'gender' => 'male', 'address' => '789 Beijing Rd', 'city' => 'Beijing', 'country' => 'China', 'postal_code' => '100000', 'is_blacklisted' => false],
            ['first_name' => 'Sarah', 'last_name' => 'Johnson', 'email' => 'sarah.j@email.com', 'phone' => '+44-20-5555-0198', 'nationality' => 'British', 'date_of_birth' => '1992-09-18', 'gender' => 'female', 'address' => '12 Baker St', 'city' => 'London', 'country' => 'UK', 'postal_code' => 'W1U 8ED', 'is_blacklisted' => false],
            ['first_name' => 'Ahmed', 'last_name' => 'Al-Rashid', 'email' => 'ahmed.ar@email.com', 'phone' => '+971-50-555-0199', 'nationality' => 'Emirati', 'date_of_birth' => '1975-05-30', 'gender' => 'male', 'address' => '1 Sheikh Zayed Rd', 'city' => 'Dubai', 'country' => 'UAE', 'postal_code' => '00000', 'is_blacklisted' => false],
            ['first_name' => 'Emma', 'last_name' => 'Wilson', 'email' => 'emma.wilson@email.com', 'phone' => '+1-415-555-0167', 'nationality' => 'American', 'date_of_birth' => '1995-12-25', 'gender' => 'female', 'address' => '200 Market St', 'city' => 'San Francisco', 'country' => 'USA', 'postal_code' => '94105', 'is_blacklisted' => false],
            ['first_name' => 'Pierre', 'last_name' => 'Dupont', 'email' => 'pierre.dupont@email.com', 'phone' => '+33-1-5555-0199', 'nationality' => 'French', 'date_of_birth' => '1983-04-10', 'gender' => 'male', 'address' => '10 Rue de Rivoli', 'city' => 'Paris', 'country' => 'France', 'postal_code' => '75001', 'is_blacklisted' => false],
            ['first_name' => 'Yuki', 'last_name' => 'Tanaka', 'email' => 'yuki.tanaka@email.com', 'phone' => '+81-3-5555-0199', 'nationality' => 'Japanese', 'date_of_birth' => '1991-08-05', 'gender' => 'female', 'address' => '5-2-1 Ginza', 'city' => 'Tokyo', 'country' => 'Japan', 'postal_code' => '104-0061', 'is_blacklisted' => false],
            ['first_name' => 'Carlos', 'last_name' => 'Santos', 'email' => 'carlos.santos@email.com', 'phone' => '+55-11-5555-0199', 'nationality' => 'Brazilian', 'date_of_birth' => '1987-06-14', 'gender' => 'male', 'address' => '100 Av Paulista', 'city' => 'Sao Paulo', 'country' => 'Brazil', 'postal_code' => '01310-100', 'is_blacklisted' => false],
            ['first_name' => 'Sophie', 'last_name' => 'Mueller', 'email' => 'sophie.m@email.com', 'phone' => '+49-30-5555-0199', 'nationality' => 'German', 'date_of_birth' => '1993-02-28', 'gender' => 'female', 'address' => '20 Unter den Linden', 'city' => 'Berlin', 'country' => 'Germany', 'postal_code' => '10117', 'is_blacklisted' => false],
            ['first_name' => 'John', 'last_name' => 'Davis', 'email' => 'john.davis@email.com', 'phone' => '+1-312-555-0198', 'nationality' => 'American', 'date_of_birth' => '1979-10-20', 'gender' => 'male', 'address' => '50 Michigan Ave', 'city' => 'Chicago', 'country' => 'USA', 'postal_code' => '60601', 'is_blacklisted' => false],
            ['first_name' => 'Anna', 'last_name' => 'Kowalski', 'email' => 'anna.k@email.com', 'phone' => '+48-22-5555-0199', 'nationality' => 'Polish', 'date_of_birth' => '1994-07-12', 'gender' => 'female', 'address' => '15 Nowy Swiat', 'city' => 'Warsaw', 'country' => 'Poland', 'postal_code' => '00-001', 'is_blacklisted' => false],
            ['first_name' => 'Mohammed', 'last_name' => 'Ali', 'email' => 'mo.ali@email.com', 'phone' => '+20-2-5555-0199', 'nationality' => 'Egyptian', 'date_of_birth' => '1986-01-15', 'gender' => 'male', 'address' => '10 Tahrir Square', 'city' => 'Cairo', 'country' => 'Egypt', 'postal_code' => '11511', 'is_blacklisted' => false],
            ['first_name' => 'Lisa', 'last_name' => 'Anderson', 'email' => 'lisa.anderson@email.com', 'phone' => '+1-617-555-0145', 'nationality' => 'American', 'date_of_birth' => '1989-09-08', 'gender' => 'female', 'address' => '75 Beacon St', 'city' => 'Boston', 'country' => 'USA', 'postal_code' => '02108', 'is_blacklisted' => false],
            ['first_name' => 'David', 'last_name' => 'Park', 'email' => 'david.park@email.com', 'phone' => '+82-2-5555-0199', 'nationality' => 'South Korean', 'date_of_birth' => '1984-11-30', 'gender' => 'male', 'address' => '100 Gangnam-daero', 'city' => 'Seoul', 'country' => 'South Korea', 'postal_code' => '06175', 'is_blacklisted' => false],
            ['first_name' => 'Olga', 'last_name' => 'Ivanova', 'email' => 'olga.ivanova@email.com', 'phone' => '+7-495-5555-0199', 'nationality' => 'Russian', 'date_of_birth' => '1996-05-20', 'gender' => 'female', 'address' => '25 Tverskaya St', 'city' => 'Moscow', 'country' => 'Russia', 'postal_code' => '125009', 'is_blacklisted' => false],
            ['first_name' => 'Robert', 'last_name' => 'Taylor', 'email' => 'robert.taylor@email.com', 'phone' => '+1-305-555-0177', 'nationality' => 'American', 'date_of_birth' => '1978-08-16', 'gender' => 'male', 'address' => '300 Ocean Dr', 'city' => 'Miami', 'country' => 'USA', 'postal_code' => '33139', 'is_blacklisted' => false],
            ['first_name' => 'Aisha', 'last_name' => 'Bello', 'email' => 'aisha.bello@email.com', 'phone' => '+234-1-5555-0199', 'nationality' => 'Nigerian', 'date_of_birth' => '1991-12-03', 'gender' => 'female', 'address' => '15 Marina St', 'city' => 'Lagos', 'country' => 'Nigeria', 'postal_code' => '100001', 'is_blacklisted' => false],
            ['first_name' => 'Thomas', 'last_name' => 'Martin', 'email' => 'thomas.martin@email.com', 'phone' => '+1-206-555-0193', 'nationality' => 'American', 'date_of_birth' => '1982-04-25', 'gender' => 'male', 'address' => '500 Pine St', 'city' => 'Seattle', 'country' => 'USA', 'postal_code' => '98101', 'is_blacklisted' => false],
            ['first_name' => 'Elena', 'last_name' => 'Rossi', 'email' => 'elena.rossi@email.com', 'phone' => '+39-06-5555-0199', 'nationality' => 'Italian', 'date_of_birth' => '1993-07-08', 'gender' => 'female', 'address' => '50 Via Roma', 'city' => 'Rome', 'country' => 'Italy', 'postal_code' => '00100', 'is_blacklisted' => false],
            ['first_name' => 'Kim', 'last_name' => 'Nguyen', 'email' => 'kim.nguyen@email.com', 'phone' => '+84-28-5555-0199', 'nationality' => 'Vietnamese', 'date_of_birth' => '1995-02-14', 'gender' => 'female', 'address' => '100 Nguyen Hue', 'city' => 'Ho Chi Minh City', 'country' => 'Vietnam', 'postal_code' => '70000', 'is_blacklisted' => false],
            ['first_name' => 'William', 'last_name' => 'Brown', 'email' => 'will.brown@email.com', 'phone' => '+1-404-555-0189', 'nationality' => 'American', 'date_of_birth' => '1980-10-31', 'gender' => 'male', 'address' => '200 Peachtree St', 'city' => 'Atlanta', 'country' => 'USA', 'postal_code' => '30303', 'is_blacklisted' => false],
            ['first_name' => 'Fatima', 'last_name' => 'Hassan', 'email' => 'fatima.h@email.com', 'phone' => '+92-21-5555-0199', 'nationality' => 'Pakistani', 'date_of_birth' => '1994-03-22', 'gender' => 'female', 'address' => '10 Shahrah-e-Faisal', 'city' => 'Karachi', 'country' => 'Pakistan', 'postal_code' => '74000', 'is_blacklisted' => false],
            ['first_name' => 'Daniel', 'last_name' => 'Lee', 'email' => 'daniel.lee@email.com', 'phone' => '+1-212-555-0123', 'nationality' => 'American', 'date_of_birth' => '1987-06-05', 'gender' => 'male', 'address' => '400 Park Ave', 'city' => 'New York', 'country' => 'USA', 'postal_code' => '10022', 'is_blacklisted' => false],
            ['first_name' => 'Isabella', 'last_name' => 'Costa', 'email' => 'isabella.costa@email.com', 'phone' => '+351-21-5555-0199', 'nationality' => 'Portuguese', 'date_of_birth' => '1992-09-15', 'gender' => 'female', 'address' => '30 Rua Augusta', 'city' => 'Lisbon', 'country' => 'Portugal', 'postal_code' => '1100-048', 'is_blacklisted' => false],
        ];

        foreach ($guests as $guestData) {
            $guestData['password'] = Hash::make('password');
            Guest::create($guestData);
        }
    }
}
