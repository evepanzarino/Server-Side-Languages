// Pallette service: the getAll query for the pallettes collection.
// The Jest tests can swap it for app/services/__mocks__/palletteService.js.
const Pallette = require('../models/Pallettes');
const runPipeline = require('./runPipeline');

// The pallettes left after the steps, plus how many match the filters.
const findPallettes = (steps) => runPipeline(Pallette, steps);

module.exports = { findPallettes };
