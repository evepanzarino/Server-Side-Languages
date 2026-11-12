// Geo data router: the routes for the geospatial API (Open-Meteo) and the
// geodata collection. app/index.js mounts this router at /api/geo-data.
const express = require('express');
const router = express.Router();

const validateId = require('../middleware/validateId');
const {
    getGeoData,
    createGeoData,
    getGeoDataById,
} = require('../controllers/geoDataController');

// Error handling: a bad query string or body gets a 400, an unknown ID a 404,
// too many calls to the API a 429, and an API that fails or takes too long
// a 502 or 504.

// a. GET /api/geo-data?lat=28.5383&lon=-81.3792  live data from the Open-Meteo API
// c. GET /api/geo-data                           the saved geo data, with filters
//    GET /api/geo-data?page=2&limit=5             the saved geo data, page 2
// Both are the same URL, so getGeoData checks for lat and lon to pick one.
router.get('/', getGeoData);

// b. POST /api/geo-data  save geo data
router.post('/', createGeoData);

// d. GET /api/geo-data/:id  one saved entry
router.get('/:id', validateId, getGeoDataById);

module.exports = router;
