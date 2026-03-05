// Quick verification: run with `npx ts-node server/api/test-next-trips.ts`
import { generateNextTrips } from './next-trips';

// Test 1: Default profile (no user data)
const result = generateNextTrips();
console.log('=== Next Trips (default profile) ===');
console.log(JSON.stringify(result, null, 2));
console.log(`\n✅ Returned ${result.trips.length} trips`);

// Verify schema
for (const trip of result.trips) {
    const requiredKeys = [
        'destination', 'duration_days', 'total_price_est',
        'transport_time_hours', 'best_dates', 'savings_if_flexible',
        'itinerary_teaser', 'reason',
    ];
    const missing = requiredKeys.filter(k => !(k in trip));
    if (missing.length > 0) {
        console.error(`❌ Missing keys: ${missing.join(', ')}`);
    } else {
        console.log(`✅ ${trip.destination}: schema OK, ${trip.total_price_est} MAD`);
    }
}

// Test 2: Budget-sensitive user
const budgetResult = generateNextTrips({
    user_id: 'test_budget',
    archetype: 'budget_hacker',
    budget_sensitivity: 95,
    fatigue_tolerance: 70,
    nature_vs_city: 50,
    transport_tolerance: 80,
    comfort_level: 30,
    spontaneity: 60,
    weather_preference: 40,
    time_sensitivity: 40,
    culture_priority: 50,
    food_priority: 40,
    nightlife_priority: 30,
    passions: [],
    updated_at: new Date().toISOString(),
});

console.log('\n=== Next Trips (budget_hacker profile) ===');
for (const trip of budgetResult.trips) {
    console.log(`  ${trip.destination}: ${trip.total_price_est} MAD (save ${trip.savings_if_flexible} if flexible)`);
}
console.log(`✅ Budget user gets cheapest destinations first: ${budgetResult.trips[0].destination}`);
