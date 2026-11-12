// Messages module: every message the pallettes, colors and geo data code sends back.
// Messages that include a value, like an ID, are functions that take that value.
// {VALUE} in a validation message is filled in by Mongoose.
const messages = {
    // App (app/index.js)
    SERVICE_UP: 'Service is up',
    ROUTE_NOT_FOUND: (method, url) => `${method} ${url} is not a route`,
    INVALID_JSON: 'Request body is not valid JSON',
    BAD_REQUEST: 'The request could not be processed',

    // Errors for both collections (app/controllers/responses.js, app/middleware/validateId.js)
    INVALID_ID: (id) => `${id} is not a valid ID`,
    INVALID_VALUE: (field, kind, value) => `${field} must be a valid ${kind} (got ${JSON.stringify(value)})`,
    VALIDATION_FAILED: 'Validation failed',
    ALREADY_TAKEN: (field, value) => `${field} "${value}" is already taken`,
    SERVER_ERROR: 'Something went wrong on the server',

    // Pallette responses (app/controllers/palletteController.js)
    PALLETTES_FOUND: 'Get all pallettes',
    PALLETTE_FOUND: 'Get pallette by ID',
    PALLETTE_CREATED: 'Pallette created',
    PALLETTE_UPDATED: 'Pallette updated',
    PALLETTE_DELETED: (colorCount) => `Pallette deleted along with ${colorCount} ${colorCount === 1 ? 'color' : 'colors'}`,
    PALLETTE_NOT_FOUND: (id) => `Pallette ${id} not found`,

    // Color responses (app/controllers/colorController.js)
    ALL_COLORS_FOUND: 'Get all colors',
    COLOR_FOUND: 'Get color by ID',
    COLOR_CREATED: 'Color created',
    COLOR_UPDATED: 'Color updated',
    COLOR_DELETED: 'Color deleted',
    COLOR_NOT_FOUND: (id) => `Color ${id} not found`,

    // Pallette validation (app/models/Pallettes.js)
    PALLETTE_NAME_REQUIRED: 'name is required',
    PALLETTE_NAME_TOO_SHORT: 'name must be at least 2 characters',
    PALLETTE_NAME_TOO_LONG: 'name must be 30 characters or fewer',
    DESCRIPTION_REQUIRED: 'Description is required',
    DESCRIPTION_TOO_LONG: 'Description must be 255 characters or fewer',
    COLOR_TYPES_REQUIRED: 'colorTypes is required',
    COLOR_TYPES_TOO_SHORT: 'colorTypes must be at least 2 characters',
    COLOR_TYPES_TOO_LONG: 'colorTypes must be 999 characters or fewer',
    HEXCODES_REQUIRED: 'hexcodes must list at least one hex code, like ["#ff4500"]',
    HEXCODE_IN_LIST_INVALID: '"{VALUE}" is not a 6-digit hex code',
    NUMBER_OF_COLORS_TOO_HIGH: 'A pallette can have 999 hexcodes at most',

    // Color validation (app/models/Colors.js)
    COLOR_NAME_REQUIRED: 'name is required',
    COLOR_NAME_TOO_LONG: 'name must be 20 characters or fewer',
    TYPE_INVALID: '"{VALUE}" is not a color type',
    COLOR_TYPE_INVALID_COUNT: 'colorType must list 1 or 2 different types',
    HEXCODE_REQUIRED: 'hexcode is required',
    INVALID_HEX_CODE: 'hexcode must be 6 hex digits, like #ff0000',
    OPACITY_REQUIRED: 'opacity must be a number from 0 to 100',
    OPACITY_TOO_LOW: 'opacity cannot be less than 0',
    OPACITY_TOO_HIGH: 'opacity cannot be more than 100',
    PALLETTE_REQUIRED: 'pallette is required',
    PALLETTE_MISSING: 'pallette {VALUE} does not exist',

    // Query strings on the getAll routes (app/utils/queryPipeline.js)
    QUERY_UNKNOWN_FIELD: (field, fields) => `"${field}" is not a field. Use one of: ${fields.join(', ')}`,
    QUERY_FIELD_LEFT_OUT: (key, field) => `${key} uses ${field}, but a select before it left ${field} out`,
    QUERY_UNKNOWN_OPERATOR: (operator) => `${operator} is not a query operator. Use one of: eq, ne, gt, gte, lt, lte, in, nin`,
    QUERY_BAD_KEY: (key) => `${key} is not something a query string can use`,
    QUERY_EMPTY_VALUE: (key) => `${key} needs a value`,
    QUERY_NOT_A_NUMBER: (key, value) => `${key} must be a number (got "${value}")`,
    QUERY_NOT_A_DATE: (key, value) => `${key} must be a date, like 2026-11-15 (got "${value}")`,
    QUERY_NOT_AN_ID: (key, value) => `${key} must be a MongoDB ID (got "${value}")`,
    QUERY_SORT_TWICE: (field) => `sort has ${field} in it more than once`,
    QUERY_SELECT_MIX: 'select can list fields to show, or fields to leave out with a -, but not both',
    QUERY_KEY_TWICE: (key) => `${key} is in the query string more than once`,
    QUERY_LIMIT_INVALID: (max) => `limit must be a whole number from 1 to ${max}`,
    QUERY_SKIP_INVALID: 'skip must be a whole number, 0 or more',
    QUERY_PAGE_INVALID: 'page must be a whole number, 1 or more',
    QUERY_PAGE_AND_SKIP: 'page does the skipping, so use page or skip, not both',

    // Geo data responses (app/controllers/geoDataController.js)
    GEO_DATA_FETCHED: 'Live geo data from the Open-Meteo API',
    GEO_DATA_SAVED: 'Geo data saved',
    GEO_DATA_FOUND: 'Get all geo data',
    GEO_DATA_FOUND_BY_ID: 'Get geo data by ID',
    GEO_DATA_NOT_FOUND: (id) => `Geo data ${id} not found`,

    // Live lookups: GET /api/geo-data?lat=...&lon=... (app/controllers/geoDataController.js)
    GEO_LOCATION_REQUIRED: 'A live lookup needs both lat and lon, like ?lat=28.5383&lon=-81.3792',
    GEO_LAT_INVALID: (value) => `lat must be a number from -90 to 90 (got "${value}")`,
    GEO_LON_INVALID: (value) => `lon must be a number from -180 to 180 (got "${value}")`,
    GEO_NAME_INVALID: 'name must be 1 to 100 characters',
    GEO_LIVE_EXTRA_KEYS: (keys) => `A live lookup only takes lat, lon and name (also got ${keys.join(', ')})`,

    // Calls to the Open-Meteo API (app/services/geoService.js)
    GEO_API_RATE_LIMITED: (seconds) => `Too many calls to the geospatial API. Try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`,
    GEO_API_FAILED: (status, reason) => `The geospatial API answered with an error (${status})${reason ? `: ${reason}` : ''}`,
    GEO_API_UNREACHABLE: 'Could not reach the geospatial API',
    GEO_API_TIMEOUT: (ms) => `The geospatial API did not answer within ${ms / 1000} seconds`,
    GEO_API_BAD_DATA: 'The geospatial API sent back data this app could not read',

    // Geo data validation (app/models/GeoData.js)
    GEO_NAME_TOO_LONG: 'name must be 100 characters or fewer',
    LATITUDE_REQUIRED: 'latitude is required',
    LATITUDE_OUT_OF_RANGE: 'latitude must be from -90 to 90',
    LONGITUDE_REQUIRED: 'longitude is required',
    LONGITUDE_OUT_OF_RANGE: 'longitude must be from -180 to 180',
    HUMIDITY_OUT_OF_RANGE: 'humidity must be from 0 to 100',
    WIND_SPEED_TOO_LOW: 'windSpeed cannot be less than 0',
    WEATHER_CODE_OUT_OF_RANGE: 'weatherCode must be from 0 to 99',
};

module.exports = messages;
