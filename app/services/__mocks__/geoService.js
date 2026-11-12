// Mocked geo service for the Jest tests. jest.mock('../services/geoService')
// swaps the real one for this, so the tests don't call the Open-Meteo API or MongoDB.
const GeoData = require('../../models/GeoData');
const { geoData } = require('../../tests/fixtures');
const runInMemory = require('../../tests/helpers/runInMemory');

// Geo data saved during this test file.
const saved = [];
const allGeoData = () => [...geoData, ...saved];

// The same weather every time, for whatever location is asked about.
const fetchConditions = async (latitude, longitude) => ({
    latitude,
    longitude,
    elevation: 35,
    timezone: 'America/New_York',
    temperature: 26.6,
    humidity: 43,
    windSpeed: 10.5,
    weatherCode: 3,
    conditions: 'Overcast',
    observedAt: '2026-11-12T17:00:00.000Z',
});

const findGeoData = async (steps) => runInMemory(allGeoData(), steps);

// Check the fields with the real schema, like create() does, then keep them in memory.
const saveGeoData = async (fields) => {
    const doc = new GeoData(fields);
    await doc.validate();
    const now = new Date();
    doc.set({ createdAt: now, updatedAt: now });
    // Store it the way the API sends it back: IDs and dates as strings.
    const entry = JSON.parse(JSON.stringify(doc));
    saved.push(entry);
    return entry;
};

const findGeoDataById = async (id) => allGeoData().find((entry) => entry._id === id.toLowerCase()) ?? null;

module.exports = {
    fetchConditions,
    findGeoData,
    saveGeoData,
    findGeoDataById,
};
