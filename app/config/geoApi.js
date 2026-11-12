// Settings for the geospatial API: Open-Meteo (https://open-meteo.com/en/docs).
// It's free for non-commercial use and doesn't need an API key.
// Each setting can be changed in .env.
module.exports = {
    // The forecast endpoint. It gives the current weather for a latitude and longitude.
    url: process.env.GEO_API_URL || 'https://api.open-meteo.com/v1/forecast',
    docs: 'https://open-meteo.com/en/docs',

    // Give up on a call that takes longer than this.
    timeoutMs: Number(process.env.GEO_API_TIMEOUT_MS) || 5000,

    // Rate limiting (bonus): at most `limit` calls to the API in any `windowMs`.
    rateLimit: {
        limit: Number(process.env.GEO_API_RATE_LIMIT) || 10,
        windowMs: Number(process.env.GEO_API_RATE_WINDOW_MS) || 60 * 1000,
    },
};
