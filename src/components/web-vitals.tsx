'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
    useReportWebVitals((metric) => {
        // Send to analytics endpoint
        const body = JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
        });

        if (process.env.NODE_ENV === 'production') {
            // Send to your analytics service
            fetch('/api/analytics/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            }).catch(console.error);
        } else {
            // Log in development
            console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
        }
    });

    return null;
}
