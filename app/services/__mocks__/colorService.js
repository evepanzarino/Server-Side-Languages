// Mocked color service for the Jest tests. jest.mock('../services/colorService')
// swaps the real one for this. It runs the same steps on the test data in
// app/tests/fixtures.js instead of MongoDB.
const { colors, pallettes } = require('../../tests/fixtures');
const runInMemory = require('../../tests/helpers/runInMemory');

// Like populate(): swap the color's pallette ID for the pallette itself.
// A color that a select left the pallette out of stays without it.
const withPallette = (color) => ('pallette' in color
    ? { ...color, pallette: pallettes.find((pallette) => pallette._id === color.pallette) }
    : color);

const findColors = async (steps) => {
    const { data, total, pageTotal } = runInMemory(colors, steps);
    return { data: data.map(withPallette), total, pageTotal };
};

module.exports = { findColors };
