// Messages module: every message the pallettes and colors code sends back.
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
    DESCRIPTION_TOO_LONG: 'Description must be 40 characters or fewer',
    COLOR_TYPES_REQUIRED: 'colorTypes is required',
    COLOR_TYPES_TOO_SHORT: 'colorTypes must be at least 2 characters',
    COLOR_TYPES_TOO_LONG: 'colorTypes must be 999 characters or fewer',
    HEXCODES_REQUIRED: 'hexcodes is required',
    HEXCODES_TOO_SHORT: 'hexcodes must be at least 2 characters',
    HEXCODES_TOO_LONG: 'hexcodes must be 999 characters or fewer',
    HEXCODES_INVALID: 'hexcodes must be 6-digit hex codes separated by commas, like #ff4500, #ffa500',
    NUMBER_OF_COLORS_TOO_LOW: 'NumberofColors cannot be less than 0',
    NUMBER_OF_COLORS_TOO_HIGH: 'NumberofColors cannot be more than 999',
    NUMBER_OF_COLORS_NOT_WHOLE: 'NumberofColors must be a whole number',

    // Color validation (app/models/Colors.js)
    COLOR_NAME_REQUIRED: 'name is required',
    COLOR_NAME_TOO_LONG: 'name must be 20 characters or fewer',
    TYPE_INVALID: '"{VALUE}" is not a color type',
    PRIMARY_TYPES_INVALID_COUNT: 'primaryColorType must list 1 or 2 different types',
    HEXCODE_REQUIRED: 'hexcode is required',
    INVALID_HEX_CODE: 'hexcode must be 6 hex digits, like #ff0000',
    OPACITY_REQUIRED: 'opacity must be a number from 0 to 100',
    OPACITY_TOO_LOW: 'opacity cannot be less than 0',
    OPACITY_TOO_HIGH: 'opacity cannot be more than 100',
    PALLETTE_REQUIRED: 'pallette is required',
    PALLETTE_MISSING: 'pallette {VALUE} does not exist',
};

module.exports = messages;
