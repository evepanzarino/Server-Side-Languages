// Rate limiter (bonus): lets `limit` calls through in any `windowMs` window.
// take() returns 0 when a call can go, or how many seconds to wait when it can't.
const createRateLimiter = ({ limit, windowMs }) => {
    // When each call in the window was made.
    let calls = [];

    return {
        take() {
            const now = Date.now();
            // Forget the calls that are out of the window.
            calls = calls.filter((time) => now - time < windowMs);
            if (calls.length >= limit) {
                // Wait until the oldest call leaves the window.
                return Math.max(1, Math.ceil((calls[0] + windowMs - now) / 1000));
            }
            calls.push(now);
            return 0;
        },
    };
};

module.exports = createRateLimiter;
