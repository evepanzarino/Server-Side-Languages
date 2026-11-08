// Pallette: a pallette of colors.
// Pallettes contain a set of colors

const mongoose = require('mongoose');
const messages = require('../messages/messages');

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
            maxlength: [40, messages.DESCRIPTION_TOO_LONG],
        },
        //String: color types present in the pallette, ex: "red, orange,black,white".
        colorTypes: {
            type: String,
            required: [true, messages.COLOR_TYPES_REQUIRED],
            trim: true,
            minlength: [2, messages.COLOR_TYPES_TOO_SHORT],
            maxlength: [999, messages.COLOR_TYPES_TOO_LONG],
        },
        //String: hexcodes present in the pallette, e.g. "#ff4500, #ffa500".
        hexcodes: {
            type: String,
            required: [true, messages.HEXCODES_REQUIRED],
            trim: true,
            minlength: [2, messages.HEXCODES_TOO_SHORT],
            maxlength: [999, messages.HEXCODES_TOO_LONG],
            // One or more 6-digit hex codes separated by commas, each with or without the #.
            match: [/^#?[0-9a-fA-F]{6}(\s*,\s*#?[0-9a-fA-F]{6})*$/, messages.HEXCODES_INVALID],
        },
        // Number: how many colors the pallette has, a whole number from 0 to 999.
        NumberofColors: {
            type: Number,
            default: 0,
            min: [0, messages.NUMBER_OF_COLORS_TOO_LOW],
            max: [999, messages.NUMBER_OF_COLORS_TOO_HIGH],
            validate: {
                validator: Number.isInteger,
                message: messages.NUMBER_OF_COLORS_NOT_WHOLE,
            },
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
