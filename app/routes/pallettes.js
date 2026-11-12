// Pallettes router: the 5 CRUD routes for the pallettes collection.
// app/index.js mounts this router at /pallettes, so "/" below means
// localhost:3000/pallettes and "/:id" means localhost:3000/pallettes/:id.
const express = require('express');
const router = express.Router();

const validateId = require('../middleware/validateId');
const {
    getAllPallettes,
    getPalletteById,
    createPallette,
    updatePallette,
    deletePallette,
} = require('../controllers/palletteController');

// Error handling: validateId sends a 400 for an :id that isn't a MongoDB ID.
// Each controller sends a 404 when no pallette has that ID, a 400 when the
// body breaks a schema rule, a 409 for a name that's taken, and a 500 for
// anything else.

// 1. GET all pallettes
// Pagination: GET /pallettes?page=1, GET /pallettes?page=2&limit=5
router.get('/', getAllPallettes);

// 2. GET a pallette by ID (with its colors)
router.get('/:id', validateId, getPalletteById);

// 3. POST a new pallette
router.post('/', createPallette);

// 4. PUT (update) a pallette by ID
router.put('/:id', validateId, updatePallette);

// 5. DELETE a pallette by ID (and its colors)
router.delete('/:id', validateId, deletePallette);

module.exports = router;
