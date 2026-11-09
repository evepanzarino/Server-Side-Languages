// Color controller: the 5 CRUD functions for the colors collection.
// app/routes/colors.js connects each function to a URL.
//
// Every response uses the same two query methods:
// - select('-__v') leaves Mongoose's version key out of the color.
// - populate('pallette', '-__v') swaps the stored pallette _id for that pallette's
//   document from the first collection, also without its version key.
const Color = require('../models/Colors');
const messages = require('../messages/messages');
const { metadata, notFound, handleError } = require('./responses');

// Only these fields are read from a request body, so a client can't set _id or __v.
const colorFields = ({ name, colorType, hexcode, opacity, pallette } = {}) => ({ name, colorType, hexcode, opacity, pallette });

// 1. GET all: every color, with its pallette.
// GET localhost:3000/colors
const getAllColors = async (req, res) => {
    try {
        const colors = await Color.find({}).select('-__v').populate('pallette', '-__v');
        res.status(200).json({
            message: messages.ALL_COLORS_FOUND,
            data: colors,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 2. GET by ID: one color, with its pallette.
// GET localhost:3000/colors/:id
const getColorById = async (req, res) => {
    const { id } = req.params;
    try {
        const color = await Color.findById(id).select('-__v').populate('pallette', '-__v');
        if (!color) return notFound(req, res, messages.COLOR_NOT_FOUND(id));

        res.status(200).json({
            message: messages.COLOR_FOUND,
            id,
            data: color,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 3. POST: create a color for an existing pallette. "pallette" is the _id of a
// document in the pallettes collection (found in MongoDB).
// POST localhost:3000/colors
// Body (raw JSON): { "name": "Sunset Red", "colorType": ["red", "orange"], "hexcode": "#ff4500", "opacity": 80, "pallette": "<pallette _id>" }
const createColor = async (req, res) => {
    try {
        // create() runs the schema validators before saving, including the
        // check that the pallette exists.
        const created = await Color.create(colorFields(req.body));
        // create() can't use select() or populate(), so read the new color back.
        const color = await Color.findById(created._id).select('-__v').populate('pallette', '-__v');

        // 201 Created: a new document was added.
        res.status(201).json({
            message: messages.COLOR_CREATED,
            data: color,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 4. PUT by ID: update a color. Only the fields sent in the body change.
// PUT localhost:3000/colors/:id
// Body (raw JSON): { "hexcode": "#ff6347", "opacity": 50 }
const updateColor = async (req, res) => {
    const { id } = req.params;
    try {
        // Check the color is in the database first, so an unknown ID
        // gets a 404 even when the body has bad values.
        const exists = await Color.exists({ _id: id });
        if (!exists) return notFound(req, res, messages.COLOR_NOT_FOUND(id));

        const color = await Color.findByIdAndUpdate(id, colorFields(req.body), {
            returnDocument: 'after', // respond with the color after the update
            runValidators: true, // check the new values against the schema
            multipleCastError: true, // list every value of the wrong type, not just the first
        }).select('-__v').populate('pallette', '-__v');
        // It could have been deleted since the check above.
        if (!color) return notFound(req, res, messages.COLOR_NOT_FOUND(id));

        res.status(200).json({
            message: messages.COLOR_UPDATED,
            id,
            data: color,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 5. DELETE by ID: remove a color.
// DELETE localhost:3000/colors/:id
const deleteColor = async (req, res) => {
    const { id } = req.params;
    try {
        // Check the color is in the database first.
        const exists = await Color.exists({ _id: id });
        if (!exists) return notFound(req, res, messages.COLOR_NOT_FOUND(id));

        const color = await Color.findByIdAndDelete(id).select('-__v').populate('pallette', '-__v');
        // It could have been deleted since the check above.
        if (!color) return notFound(req, res, messages.COLOR_NOT_FOUND(id));

        res.status(200).json({
            message: messages.COLOR_DELETED,
            id,
            data: color,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

module.exports = {
    getAllColors,
    getColorById,
    createColor,
    updateColor,
    deleteColor,
};
