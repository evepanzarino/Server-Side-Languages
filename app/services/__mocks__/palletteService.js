// Mocked pallette service for the Jest tests. jest.mock('../services/palletteService')
// swaps the real one for this. It runs the same steps on the test data in
// app/tests/fixtures.js instead of MongoDB.
const { pallettes } = require('../../tests/fixtures');
const runInMemory = require('../../tests/helpers/runInMemory');

const findPallettes = async (steps) => runInMemory(pallettes, steps);

module.exports = { findPallettes };
