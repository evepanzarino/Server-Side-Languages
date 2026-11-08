// Color: a color that belongs to a pallette.
const mongoose = require('mongoose');
const Pallette = require('./Pallettes');
const messages = require('../messages/messages');

// The 10 color types. 
const COLOR_TYPES = [
    'red', 'orange', 'yellow', 'green', 'blue', 'purple',
    'black', 'white', 'brown', 'beige',
];

// primaryColorType list.
const colorType = {
    type: String,
    lowercase: true,
    trim: true,
    enum: {
        values: COLOR_TYPES,
        message: messages.TYPE_INVALID,
    },
};

// no nulls or repeats function
const hasNoNullsOrRepeats = (types) => Array.isArray(types)
    && !types.includes(null)
    && new Set(types).size === types.length;

const COLORSchema = new mongoose.Schema({
    // String: the color's name, ex: Red, blue
    name: {
        type: String,
        required: [true, messages.COLOR_NAME_REQUIRED],
        trim: true,
        maxlength: [20, messages.COLOR_NAME_TOO_LONG],
    },
    // Array of Strings: one or two types from COLOR_TYPES, e.g. ["red", "orange"].
    primaryColorType: {
        type: [colorType],
        validate: {
            validator: (types) => hasNoNullsOrRepeats(types)
                && types.length >= 1
                && types.length <= 2,
            message: messages.PRIMARY_TYPES_INVALID_COUNT,
        },
    },
    // String: the color's 6-digit hex code, with or without the #, e.g. "#ff4500".
    hexcode: {
        type: String,
        default: '#000000',
        required: [true, messages.HEXCODE_REQUIRED],
        match: [/^#?([a-fA-F0-9]{6})$/, messages.INVALID_HEX_CODE],
    },
    // number 0-100
    // 0 is fully transparent
    // 100 is fully opacity
    opacity: {
        type: Number,
        default: 100,
        required: [true, messages.OPACITY_REQUIRED],
        min: [0, messages.OPACITY_TOO_LOW],
        max: [100, messages.OPACITY_TOO_HIGH],
    },
    // ObjectId: the _id of the Pallette this color belongs to.
    // "ref" tells .populate('pallette') which model to load it from.
    pallette: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pallette',
        required: [true, messages.PALLETTE_REQUIRED],
        validate: {
            // Async validator: the ID must belong to a pallette that exists.
            validator: async (palletteId) => Boolean(await Pallette.exists({ _id: palletteId })),
            message: messages.PALLETTE_MISSING,
        },
    },
});

// The third argument names the MongoDB collection "color"
module.exports = mongoose.model('Color', COLORSchema, 'color');
