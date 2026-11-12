// Color service: the getAll query for the colors collection.
// The Jest tests can swap it for app/services/__mocks__/colorService.js.
const Color = require('../models/Colors');
const runPipeline = require('./runPipeline');

// The colors left after the steps, with their pallettes, plus how many match the filters.
// A color that a select left the pallette out of stays without it.
const findColors = (steps) => runPipeline(Color, steps, { path: 'pallette', select: '-__v' });

module.exports = { findColors };
