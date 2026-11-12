// Express application: sets up middleware and connects the routes.
// server.js imports this app and starts the server.
const express = require('express');
const app = express();
const userRoutes = require('./routes');
const bookRoutes = require('./routes/books');
const palletteRoutes = require('./routes/pallettes');
const colorRoutes = require('./routes/colors');
const geoDataRoutes = require('./routes/geoData');
const messages = require('./messages/messages');
const { metadata } = require('./controllers/responses');

// Parse JSON request bodies into req.body, which POST and PUT need.
app.use(express.json());

// localhost:3000 reports that the service is running.
app.get('/', (req, res) => {
    res.status(200).json({
        message: messages.SERVICE_UP,
        metadata: {
            method: req.method,
            hostname: req.hostname,
        }
    });
});



// Context name: every user route lives under localhost:3000/users.
app.use('/users', userRoutes);
// Context name: every book route lives under localhost:3000/books.
app.use('/books', bookRoutes);
// Context name: every pallette route (MongoDB) lives under localhost:3000/pallettes.
app.use('/pallettes', palletteRoutes);
// Context name: every color route (MongoDB) lives under localhost:3000/colors.
app.use('/colors', colorRoutes);
// Context name: the geospatial API routes live under localhost:3000/api/geo-data.
app.use('/api/geo-data', geoDataRoutes);

// A request that matched none of the routes above gets a JSON 404.
app.use((req, res) => {
    res.status(404).json({
        message: messages.ROUTE_NOT_FOUND(req.method, req.originalUrl),
        metadata: metadata(req),
    });
});

// Error handler for errors that happen before a route runs, such as a request
// body that isn't valid JSON. Express treats a function with 4 arguments as an
// error handler.
app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: messages.INVALID_JSON,
            metadata: metadata(req),
        });
    }

    const status = error.status || 500;
    if (status >= 500) console.error(error);
    res.status(status).json({
        // A client error (4xx), such as a body that is too large or a URL that
        // can't be read, gets a general message. Anything else is a server problem.
        message: status < 500 ? messages.BAD_REQUEST : messages.SERVER_ERROR,
        metadata: metadata(req),
    });
});

module.exports = app;
