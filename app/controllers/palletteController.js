// Pallette controller: the 5 CRUD functions for the pallettes collection.
// app/routes/pallettes.js connects each function to a URL.
const Pallette = require('../models/Pallettes');
const Color = require('../models/Colors');
const messages = require('../messages/messages');
const { metadata, notFound, handleError } = require('./responses');
const { queryPipeline, pagination } = require('../utils/queryPipeline');
const { findPallettes } = require('../services/palletteService');

// NumberofColors counts the hexcodes. One hex code sent as a string counts as 1.
// No hexcodes sent means no count, so a PUT without hexcodes keeps the old number.
const countHexcodes = (hexcodes) => {
    if (hexcodes === undefined) return undefined;
    return Array.isArray(hexcodes) ? hexcodes.length : 1;
};

// Only these fields are read from a request body, so a client can't set _id or __v.
// NumberofColors isn't read from the body. It's counted from hexcodes.
const palletteFields = ({ name, Description, colorTypes, hexcodes } = {}) => ({
    name,
    Description,
    colorTypes,
    hexcodes,
    NumberofColors: countHexcodes(hexcodes),
});

// 1. GET all: pallettes, 10 at a time, sorted by name.
// GET localhost:3000/pallettes
// The query string can filter, sort, skip, limit and select, and each one runs
// in the order it's written (app/utils/queryPipeline.js), e.g.
// GET localhost:3000/pallettes?NumberofColors[gte]=3&sort=-NumberofColors&skip=1&limit=2&select=name,NumberofColors
// Pagination: GET localhost:3000/pallettes?page=1 is the first 10, ?page=2&limit=5 is pallettes 6 to 10.
const getAllPallettes = async (req, res) => {
    try {
        const steps = queryPipeline(req, Pallette.schema, { defaultSort: 'name' });
        const { data, total, pageTotal } = await findPallettes(steps);
        res.status(200).json({
            message: messages.PALLETTES_FOUND,
            query: steps,
            count: data.length,
            total,
            // Only there when the query string has a page.
            pagination: pagination(req, steps, pageTotal),
            data,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 2. GET by ID: one pallette, with the colors it has.
// GET localhost:3000/pallettes/:id
const getPalletteById = async (req, res) => {
    const { id } = req.params;
    try {
        // populate('color') fills the virtual "color" field from the colors collection.
        const pallette = await Pallette.findById(id).select('-__v').populate('color', '-__v');
        if (!pallette) return notFound(req, res, messages.PALLETTE_NOT_FOUND(id));

        res.status(200).json({
            message: messages.PALLETTE_FOUND,
            id,
            data: pallette,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 3. POST: create a pallette.
// POST localhost:3000/pallettes
// Body (raw JSON): { "name": "Sunset", "Description": "Warm sunset colors", "colorTypes": "red, orange", "hexcodes": ["#ff4500", "#ffa500"] }
// NumberofColors is saved as 2, one for each hex code.
const createPallette = async (req, res) => {
    try {
        // create() runs the schema validators before saving.
        const created = await Pallette.create(palletteFields(req.body));
        // create() can't use select(), so read the new pallette back without __v.
        const pallette = await Pallette.findById(created._id).select('-__v');

        // 201 Created: a new document was added.
        res.status(201).json({
            message: messages.PALLETTE_CREATED,
            data: pallette,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 4. PUT by ID: update a pallette. Only the fields sent in the body change.
// PUT localhost:3000/pallettes/:id
// Body (raw JSON): { "hexcodes": ["#00ffff", "#008080", "#000080"] }
// Sending new hexcodes changes NumberofColors to match, here 3.
const updatePallette = async (req, res) => {
    const { id } = req.params;
    try {
        // Check the pallette is in the database first, so an unknown ID
        // gets a 404 even when the body has bad values.
        const exists = await Pallette.exists({ _id: id });
        if (!exists) return notFound(req, res, messages.PALLETTE_NOT_FOUND(id));

        const pallette = await Pallette.findByIdAndUpdate(id, palletteFields(req.body), {
            returnDocument: 'after', // respond with the pallette after the update
            runValidators: true, // check the new values against the schema
            multipleCastError: true, // list every value of the wrong type, not just the first
        }).select('-__v');
        // It could have been deleted since the check above.
        if (!pallette) return notFound(req, res, messages.PALLETTE_NOT_FOUND(id));

        res.status(200).json({
            message: messages.PALLETTE_UPDATED,
            id,
            data: pallette,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

// 5. DELETE by ID: remove a pallette and the colors it has.
// DELETE localhost:3000/pallettes/:id
const deletePallette = async (req, res) => {
    const { id } = req.params;
    try {
        // Check the pallette is in the database first.
        const exists = await Pallette.exists({ _id: id });
        if (!exists) return notFound(req, res, messages.PALLETTE_NOT_FOUND(id));

        const pallette = await Pallette.findByIdAndDelete(id).select('-__v');
        // It could have been deleted since the check above.
        if (!pallette) return notFound(req, res, messages.PALLETTE_NOT_FOUND(id));

        // A color can't exist without its pallette, so delete its colors too.
        const { deletedCount } = await Color.deleteMany({ pallette: id });

        res.status(200).json({
            message: messages.PALLETTE_DELETED(deletedCount),
            id,
            data: pallette,
            metadata: metadata(req),
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

module.exports = {
    getAllPallettes,
    getPalletteById,
    createPallette,
    updatePallette,
    deletePallette,
};
