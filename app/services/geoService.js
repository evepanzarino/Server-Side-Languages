// Geo service: asks the Open-Meteo API about a location, and reads and saves
// geo data in MongoDB. The Jest tests can swap it for app/services/__mocks__/geoService.js.
const GeoData = require('../models/GeoData');
const geoApi = require('../config/geoApi');
const messages = require('../messages/messages');
const httpError = require('../utils/httpError');
const runPipeline = require('./runPipeline');

// Open-Meteo's weather codes in words (WMO codes, from the bottom of its docs page).
const WEATHER_CODES = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

// 1. Fetch the weather right now at a location from the Open-Meteo API.
// Returns it in the same shape POST /api/geo-data saves.
const fetchConditions = async (latitude, longitude) => {
    const url = `${geoApi.url}?${new URLSearchParams({
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
        timezone: 'auto', // the location's own time zone
        timeformat: 'unixtime', // times as seconds since 1970 (UTC)
    })}`;

    let response;
    try {
        // AbortSignal.timeout stops the call if it takes too long.
        response = await fetch(url, { signal: AbortSignal.timeout(geoApi.timeoutMs) });
    } catch (error) {
        if (error.name === 'TimeoutError') throw httpError(504, messages.GEO_API_TIMEOUT(geoApi.timeoutMs));
        throw httpError(502, messages.GEO_API_UNREACHABLE);
    }

    // When Open-Meteo can't answer, it sends { error: true, reason: "..." }.
    const body = await response.json().catch(() => null);
    if (!response.ok) throw httpError(502, messages.GEO_API_FAILED(response.status, body?.reason));
    if (!body?.current) throw httpError(502, messages.GEO_API_BAD_DATA);

    // Keep the parts this app saves, with simpler names.
    const { current } = body;
    return {
        latitude,
        longitude,
        elevation: body.elevation,
        timezone: body.timezone,
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        conditions: WEATHER_CODES[current.weather_code] ?? 'Unknown',
        observedAt: new Date(current.time * 1000).toISOString(),
    };
};

// 2. The saved geo data left after the steps, plus how many entries match the filters.
const findGeoData = (steps) => runPipeline(GeoData, steps);

// 3. Save geo data. create() runs the schema validators first.
const saveGeoData = async (fields) => {
    const created = await GeoData.create(fields);
    // create() can't use select(), so read it back without __v.
    return GeoData.findById(created._id).select('-__v');
};

// 4. One saved geo data entry by its ID, or null.
const findGeoDataById = (id) => GeoData.findById(id).select('-__v');

module.exports = {
    fetchConditions,
    findGeoData,
    saveGeoData,
    findGeoDataById,
    WEATHER_CODES,
};
