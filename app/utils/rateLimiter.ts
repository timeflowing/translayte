const requestCounts: { [key: string]: { count: number; last: number } } = {};

export function rateLimit(ip: string, limit = 20, windowMs = 60000) {
    const now = Date.now();
    const ipKey = ip || 'unknown';

    if (!requestCounts[ipKey] || now - requestCounts[ipKey].last > windowMs) {
        requestCounts[ipKey] = { count: 1, last: now };
        return false;
    }
    requestCounts[ipKey].count++;
    requestCounts[ipKey].last = now;
    return requestCounts[ipKey].count > limit;
}
