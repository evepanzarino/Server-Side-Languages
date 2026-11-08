// Entry point: connects to MongoDB, then starts the HTTP server.
// Run with `npm run dev` or `npm start`.
const http = require('http');
// Load the variables in .env (like PORT and MONGODB_URI) into process.env.
require('dotenv').config();

const connectDB = require('./app/db/config');

// Use the PORT from .env, or 3000 if it isn't set.
const PORT = process.env.PORT || 3000;
const app = require('./app');
// The Express app handles every request the server receives.
const server = http.createServer(app);

// Connect to the database first, so the routes never run without it.
// If MongoDB can't be reached, log why and stop instead of starting a broken server.
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    })
    .catch((error) => {
        console.error('Could not connect to MongoDB:', error.message);
        process.exit(1);
    });
