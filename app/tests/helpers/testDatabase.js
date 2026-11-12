// Mocked or real services for the Jest tests.
// npm test                 uses the mocked services (no MongoDB, no Open-Meteo API)
// npm run test:real        sets MOCK_SERVICES=false and runs the same tests on a
//                          MongoDB test database with the same data, and the real API
const os = require('os');
const mongoose = require('mongoose');
const Pallette = require('../../models/Pallettes');
const Color = require('../../models/Colors');
const GeoData = require('../../models/GeoData');
const fixtures = require('../fixtures');

const useMocks = process.env.MOCK_SERVICES !== 'false';

// Connect to a test database for one test file and fill it with the test data.
// Its name always starts with color-pallettes-test-, so the real database is
// never touched, and each test file gets its own so they can run at the same time.
const startDatabase = async (name) => {
    if (useMocks) return;
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017', {
        dbName: `color-pallettes-test-${name}`,
        // The MongoDB driver loads the os module with import(), which Jest can't run,
        // so hand it the os module here. Without it MongoDB turns the connection down.
        runtimeAdapters: { os },
    });
    await mongoose.connection.dropDatabase();
    await Pallette.insertMany(fixtures.pallettes);
    await Color.insertMany(fixtures.colors);
    await GeoData.insertMany(fixtures.geoData);
};

// Delete the test database and disconnect.
const stopDatabase = async () => {
    if (useMocks) return;
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
};

module.exports = { useMocks, startDatabase, stopDatabase };
