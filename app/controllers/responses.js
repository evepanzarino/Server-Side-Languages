// Response helpers shared by the pallette and color controllers.
const messages = require('../messages/messages');

// Request details included in every response.
const metadata = (req) => ({ hostname: req.hostname, method: req.method });

// 404 response for the by-ID routes when no document has that ID.
// "message" comes from the Messages module, e.g. messages.PALLETTE_NOT_FOUND(id).
const notFound = (req, res, message) => {
    res.status(404).json({
        message,
        id: req.params.id,
        metadata: metadata(req),
    });
};

// Message for a value Mongoose couldn't convert to the schema's type,
// e.g. "abc" for a Number field.
const castMessage = (error) => {
    // Array items report their kind as "[string]", so the brackets are removed.
    const kind = error.kind === 'ObjectId' ? 'ID' : error.kind.replace(/[[\]]/g, '').toLowerCase();
    return messages.INVALID_VALUE(error.path, kind, error.value);
};

// Every controller's catch block calls this. It turns the error into a JSON
// response with the matching status code.
const handleError = (error, req, res) => {
    // An error made with httpError() already has its status code, like 400 for a
    // bad query string or 502 when the geospatial API fails.
    if (error.name === 'HttpError') {
        return res.status(error.status).json({
            message: error.message,
            metadata: metadata(req),
        });
    }

    // 400: one or more fields broke a schema rule (required, min, max, enum,
    // custom validators). Each field's message is listed under "errors".
    if (error.name === 'ValidationError') {
        const errors = {};
        for (const [field, fieldError] of Object.entries(error.errors)) {
            errors[field] = fieldError.name === 'CastError' ? castMessage(fieldError) : fieldError.message;
        }
        return res.status(400).json({
            message: messages.VALIDATION_FAILED,
            errors,
            metadata: metadata(req),
        });
    }

    // 400: a value in a PUT body couldn't be converted to the schema's type.
    if (error.name === 'CastError') {
        return res.status(400).json({
            message: castMessage(error),
            metadata: metadata(req),
        });
    }

    // 409 Conflict: MongoDB error 11000 means a unique field (a pallette's
    // name) already has this value.
    if (error.code === 11000) {
        const [field, value] = Object.entries(error.keyValue)[0];
        return res.status(409).json({
            message: messages.ALREADY_TAKEN(field, value),
            metadata: metadata(req),
        });
    }

    // 500: anything else is a server problem, such as the database being down.
    // Log the details for debugging, but don't send them to the client.
    console.error(error);
    res.status(500).json({
        message: messages.SERVER_ERROR,
        metadata: metadata(req),
    });
};

module.exports = { metadata, notFound, handleError };
