// Route middleware for the by-ID routes. A MongoDB _id is a 24-character
// hex string (e.g. 6729f1c2a4b5c6d7e8f90123), so any other :id gets a 400
// response before the controller asks the database.
const mongoose = require('mongoose');
const messages = require('../messages/messages');
const { metadata } = require('../controllers/responses');

const validateId = (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) {
        return res.status(400).json({
            message: messages.INVALID_ID(id),
            id,
            metadata: metadata(req),
        });
    }
    next();
};

module.exports = validateId;
