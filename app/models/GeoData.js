// GeoData: the weather at a location, from the Open-Meteo API.
// GET /api/geo-data?lat=...&lon=... fetches it, and POST /api/geo-data saves it here.
const mongoose = require('mongoose');
const messages = require('../messages/messages');

const geoDataSchema = new mongoose.Schema(
    {
        // String: a name for the place, ex: "Full Sail University". Optional.
        name: {
            type: String,
            trim: true,
            maxlength: [100, messages.GEO_NAME_TOO_LONG],
        },
        // Number: -90 (South Pole) to 90 (North Pole).
        latitude: {
            type: Number,
            required: [true, messages.LATITUDE_REQUIRED],
            min: [-90, messages.LATITUDE_OUT_OF_RANGE],
            max: [90, messages.LATITUDE_OUT_OF_RANGE],
        },
        // Number: -180 to 180, negative is west of Greenwich.
        longitude: {
            type: Number,
            required: [true, messages.LONGITUDE_REQUIRED],
            min: [-180, messages.LONGITUDE_OUT_OF_RANGE],
            max: [180, messages.LONGITUDE_OUT_OF_RANGE],
        },
        // Number: meters above sea level.
        elevation: {
            type: Number,
        },
        // String: the location's time zone, ex: "America/New_York".
        timezone: {
            type: String,
            trim: true,
        },
        // Number: degrees Celsius.
        temperature: {
            type: Number,
        },
        // Number: relative humidity, 0-100 %.
        humidity: {
            type: Number,
            min: [0, messages.HUMIDITY_OUT_OF_RANGE],
            max: [100, messages.HUMIDITY_OUT_OF_RANGE],
        },
        // Number: km/h.
        windSpeed: {
            type: Number,
            min: [0, messages.WIND_SPEED_TOO_LOW],
        },
        // Number: the WMO weather code, ex: 3 is overcast.
        weatherCode: {
            type: Number,
            min: [0, messages.WEATHER_CODE_OUT_OF_RANGE],
            max: [99, messages.WEATHER_CODE_OUT_OF_RANGE],
        },
        // String: the weather code in words, ex: "Overcast".
        conditions: {
            type: String,
            trim: true,
        },
        // Date: when the weather was measured. Now, if it isn't sent.
        observedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Adds createdAt and updatedAt dates.
        timestamps: true,
    }
);

// The third argument names the MongoDB collection "geodata".
module.exports = mongoose.model('GeoData', geoDataSchema, 'geodata');
