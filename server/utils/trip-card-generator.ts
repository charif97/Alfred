// ALFRED — Social Trip Brag Card Generator (Phase 16)
// A lightweight utility generating an SVG wrapper visually matching the UI.
// In a full production environment via vercel, we would use vercel/satori.
// Here we output a Base64-encoded SVG string mimicking a 9:16 card.

import type { Plan } from '../../lib/types';
import { COLORS } from '../../lib/constants';

export function generateTripCardSvg(trip: Partial<Plan>, username: string = 'Alfred'): string {
    const dest = trip.destination || 'Mystery Destination';
    const duration = trip.duration_days || 3;
    const price = trip.total_price_est || '???';
    const whyBullets = trip.why_bullets || [];
    const tradeoff = trip.tradeoff || '';
    const origin = 'Casa';

    const cleanBullet1 = whyBullets[0] ? `✓ ${whyBullets[0].replace(/'/g, "&apos;")}` : '';
    const cleanBullet2 = whyBullets[1] ? `✓ ${whyBullets[1].replace(/'/g, "&apos;")}` : '';

    // We construct a dynamic SVG string holding our basic components in a clean, vertical aesthetic layout
    const svgContent = `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Background Base -->
    <rect width="1080" height="1920" fill="${COLORS.surface}" />
    
    <!-- Decorative Header Gradient Placeholder (Using solid block for simple SVG cross-compat) -->
    <rect width="1080" height="600" fill="${COLORS.primary}11" />
    <path d="M0 600 Q 540 700 1080 600 L 1080 0 L 0 0 Z" fill="${COLORS.primary}22" />

    <!-- Title Layer -->
    <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600" fill="${COLORS.primary}">
        STEAL MY TRIP TO
    </text>
    <text x="80" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="900" fill="${COLORS.text}" letter-spacing="-2">
        ${dest}
    </text>
    <text x="80" y="460" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="500" fill="${COLORS.textMuted}">
        ${duration} Days  •  Departing ${origin}
    </text>

    <!-- Main Card Body -->
    <rect x="80" y="580" width="920" height="1060" rx="40" fill="#FFFFFF" stroke="${COLORS.border}" stroke-width="2" />
    
    <!-- Price Block -->
    <text x="140" y="700" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="${COLORS.textMuted}">
        ESTIMATED TOTAL
    </text>
    <text x="140" y="780" font-family="system-ui, -apple-system, sans-serif" font-size="80" font-weight="900" fill="${COLORS.primary}">
        ~${price} MAD
    </text>

    <!-- Divider -->
    <line x1="140" y1="860" x2="940" y2="860" stroke="${COLORS.border}" stroke-width="2" />

    <!-- Why Bullets -->
    <text x="140" y="960" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="${COLORS.text}">
        Why this trip works:
    </text>
    <text x="140" y="1040" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="500" fill="${COLORS.success}">
        ${cleanBullet1}
    </text>
    <text x="140" y="1120" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="500" fill="${COLORS.success}">
        ${cleanBullet2}
    </text>

    <!-- Tradeoff Section -->
    <rect x="140" y="1220" width="800" height="140" rx="20" fill="${COLORS.warning}11" />
    <text x="180" y="1285" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${COLORS.warning}" font-style="italic">
        The Catch:
    </text>
    <text x="180" y="1335" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="${COLORS.warning}">
        ${tradeoff.length > 50 ? tradeoff.substring(0, 47) + '...' : tradeoff}
    </text>

    <!-- Attribution Footer -->
    <text x="540" y="1800" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="40" font-weight="800" fill="${COLORS.text}">
        alfred.travel
    </text>
    <text x="540" y="1850" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="500" fill="${COLORS.textMuted}">
        Planned by @${username}
    </text>
</svg>
`;

    // Return the SVG encoded as a data URI to be consumed directly by React Native `<Image source={{ uri: ... }} />` 
    // or passed down through the share sheet.
    const encodedSvg = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${encodedSvg}`;
}
