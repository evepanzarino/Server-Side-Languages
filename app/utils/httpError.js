// An error that knows which status code to answer with, like 400 for a bad
// query string or 502 when the geospatial API fails.
// handleError() in app/controllers/responses.js sends it back as JSON.
const httpError = (status, message) => Object.assign(new Error(message), { name: 'HttpError', status });

module.exports = httpError;
