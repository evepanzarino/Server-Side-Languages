// Colors router: the 5 CRUD routes for the colors collection.
// app/index.js mounts this router at /colors, so "/" below means
// localhost:3000/colors and "/:id" means localhost:3000/colors/:id.
const express = require('express');
const router = express.Router();

const validateId = require('../middleware/validateId');
const {
    getAllColors,
    getColorById,
    createColor,
    updateColor,
    deleteColor,
} = require('../controllers/colorController');

// Error handling: validateId sends a 400 for an :id that isn't a MongoDB ID.
// Each controller sends a 404 when no color has that ID, a 400 when the
// body breaks a schema rule (including a pallette that doesn't exist), and a
// 500 for anything else.

// 1. GET all colors
router.get('/', getAllColors);

// 2. GET a color by ID (with its pallette)
router.get('/:id', validateId, getColorById);

// 3. POST a new color
router.post('/', createColor);

// 4. PUT (update) a color by ID
router.put('/:id', validateId, updateColor);

// 5. DELETE a color by ID
router.delete('/:id', validateId, deleteColor);

module.exports = router;
