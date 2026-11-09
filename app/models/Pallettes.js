// Pallette: a pallette of colors.
// Pallettes contain a set of colors

const mongoose = require('mongoose');
const messages = require('../messages/messages');

// One hex code in the hexcodes list: 6 digits, with or without the #.
const hexcode = {
    type: String,
    trim: true,
    match: [/^#?[0-9a-fA-F]{6}$/, messages.HEXCODE_IN_LIST_INVALID],
};

const palletteSchema = new mongoose.Schema(
    {
        //String: pallette's name.
        name: {
            type: String,
            required: [true, messages.PALLETTE_NAME_REQUIRED],
            trim: true,
            minlength: [2, messages.PALLETTE_NAME_TOO_SHORT],
            maxlength: [30, messages.PALLETTE_NAME_TOO_LONG],
            unique: true,
        },
        //String: short description of the pallette.
        Description: {
            type: String,
            required: [true, messages.DESCRIPTION_REQUIRED],
            trim: true,
            maxlength: [255, messages.DESCRIPTION_TOO_LONG],
        },
        //String: color types present in the pallette, ex: "red, orange,black,white".
        colorTypes: {
            type: String,
            required: [true, messages.COLOR_TYPES_REQUIRED],
            trim: true,
            minlength: [2, messages.COLOR_TYPES_TOO_SHORT],
            maxlength: [999, messages.COLOR_TYPES_TOO_LONG],
        },
        //Array: hexcodes present in the pallette, ex: ["#ff4500", "#ffa500"].
        hexcodes: {
            type: [hexcode],
            validate: {
                // At least one hex code, with no blanks or nulls in the list.
                validator: (codes) => Array.isArray(codes)
                    && codes.length >= 1
                    && codes.every((code) => code != null && code !== ''),
                message: messages.HEXCODES_REQUIRED,
            },
        },
        // Number: how many hexcodes the pallette has, up to 999.
        // The controller counts it from hexcodes, so it isn't sent in the body.
        NumberofColors: {
            type: Number,
            max: [999, messages.NUMBER_OF_COLORS_TOO_HIGH],
        },
    },
    {
        // Include virtual fields (like "color" below) when a pallette is sent as JSON.
        toJSON: { virtuals: true },
        id: false,
    }
);

// Virtual field: it isn't saved on the pallette. 
palletteSchema.virtual('color', {
    ref: 'Color',
    localField: '_id',
    foreignField: 'pallette',
});

module.exports = mongoose.model('Pallette', palletteSchema);
