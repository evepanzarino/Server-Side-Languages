// MongoDB connection. server.js calls connectDB() and only starts the server
// once the database is connected.
const mongoose = require('mongoose');

const connectDB = async () => {
    // Use MONGODB_URI from .env, or the local MongoDB database if it isn't set.
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/color-pallettes';
    await mongoose.connect(uri);
    console.log(`MongoDB connected to the "${mongoose.connection.name}" database`);
};

module.exports = connectDB;
