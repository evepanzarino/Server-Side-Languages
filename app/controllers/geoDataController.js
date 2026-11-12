// Geo data controller: the functions for /api/geo-data.
// app/routes/geoData.js connects each function to a URL.
const GeoData = require('../models/GeoData');
const geoApi = require('../config/geoApi');
const messages = require('../messages/messages');
const httpError = require('../utils/httpError');
const createRateLimiter = require('../utils/rateLimiter');
const { metadata, notFound, handleError } = require('./responses');
const { queryPipeline, pagination, searchParams } = require('../utils/queryPipeline');
const {
    fetchConditions,
    findGeoData,
    saveGeoData,
    findGeoDataById,
} = require('../services/geoService');

// Rate limiting (bonus): every call to the Open-Meteo API counts.
const apiLimiter = createRateLimiter(geoApi.rateLimit);

// Only these fields are read from a request body, so a client can't set _id or __v.
const geoDataFields = ({
    name, latitude, longitude, elevation, timezone, temperature,
    humidity, windSpeed, weatherCode, conditions, observedAt,
} = {}) => ({
    name, latitude, longitude, elevation, timezone, temperature,
    humidity, windSpeed, weatherCode, conditions, observedAt,
});

// lat or lon in the query string makes GET /api/geo-data a live lookup.
const isLiveLookup = (req) => {
    const params = searchParams(req);
    return params.has('lat') || params.has('lon');
};

// Check the lat, lon and name of a live lookup.
const readLocation = (req) => {
    const params = searchParams(req);
    const extraKeys = [...new Set(params.keys())].filter((key) => !['lat', 'lon', 'name'].includes(key));
    if (extraKeys.length > 0) throw httpError(400, messages.GEO_LIVE_EXTRA_KEYS(extraKeys));
    for (const key of ['lat', 'lon', 'name']) {
        if (params.getAll(key).length > 1) throw httpError(400, messages.QUERY_KEY_TWICE(key));
    }

    const lat = params.get('lat');
    const lon = params.get('lon');
    if (lat === null || lon === null) throw httpError(400, messages.GEO_LOCATION_REQUIRED);

    // Number('') is 0, so a blank lat or lon is checked first.
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (lat.trim() === '' || !(latitude >= -90 && latitude <= 90)) throw httpError(400, messages.GEO_LAT_INVALID(lat));
    if (lon.trim() === '' || !(longitude >= -180 && longitude <= 180)) throw httpError(400, messages.GEO_LON_INVALID(lon));

    const name = params.get('name')?.trim();
    if (name !== undefined && (name === '' || name.length > 100)) throw httpError(400, messages.GEO_NAME_INVALID);

    return { latitude, longitude, name };
};

// a. GET with lat and lon: the weather at that location right now from the Open-Meteo API. 
// GET localhost:3000/api/geo-data?lat=28.5383&lon=-81.3792&name=Orlando  (name is optional)
// "data" is ready to send to POST /api/geo-data.
const getLiveGeoData = async (req, res) => {
    try {
        const { latitude, longitude, name } = readLocation(req);

        // Only calls that would reach the API count toward the rate limit,
        // so a bad lat or lon doesn't use one up.
        const wait = apiLimiter.take();
        if (wait > 0) {
            res.set('Retry-After', String(wait));
            throw httpError(429, messages.GEO_API_RATE_LIMITED(wait));
        }

        const conditions = await fetchConditions(latitude, longitude);
        res.status(200).json({
            message: messages.GEO_DATA_FETCHED,
            source: geoApi.docs,
            data: { name, ...conditions },
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// c. GET without lat and lon: the geo data saved in MongoDB, newest first, 10 at a time.
// GET localhost:3000/api/geo-data
// The query string can filter, sort, skip, limit, page and select in any order,
// like the other getAll routes:
// by date range: ?observedAt[gte]=2026-11-01&observedAt[lt]=2026-11-16
// by location:   ?latitude[gte]=27&latitude[lte]=29&longitude[gte]=-83&longitude[lte]=-80
const getGeoData = async (req, res) => {
    if (isLiveLookup(req)) return getLiveGeoData(req, res);

    try {
        const steps = queryPipeline(req, GeoData.schema, { defaultSort: '-observedAt' });
        const { data, total, pageTotal } = await findGeoData(steps);
        res.status(200).json({
            message: messages.GEO_DATA_FOUND,
            query: steps,
            count: data.length,
            total,
            // Only there when the query string has a page.
            pagination: pagination(req, steps, pageTotal),
            data,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// b. POST: save geo data. latitude and longitude are required.
// POST localhost:3000/api/geo-data
// Body (raw JSON): the "data" from a live lookup, e.g.
// { "name": "Orlando", "latitude": 28.5383, "longitude": -81.3792, "temperature": 26.6, "humidity": 43, ... }
const createGeoData = async (req, res) => {
    try {
        const geoData = await saveGeoData(geoDataFields(req.body));

        // 201 Created, with the saved document's ID.
        res.status(201).json({
            message: messages.GEO_DATA_SAVED,
            id: geoData._id,
            data: geoData,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// d. GET by ID: one saved geo data entry.
// GET localhost:3000/api/geo-data/:id
const getGeoDataById = async (req, res) => {
    const { id } = req.params;
    try {
        const geoData = await findGeoDataById(id);
        if (!geoData) return notFound(req, res, messages.GEO_DATA_NOT_FOUND(id));

        res.status(200).json({
            message: messages.GEO_DATA_FOUND_BY_ID,
            id,
            data: geoData,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

module.exports = {
    getGeoData,
    createGeoData,
    getGeoDataById,
};
