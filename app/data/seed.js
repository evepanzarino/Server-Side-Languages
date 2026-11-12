// Seed: puts the pallettes in pallettes.json and the colors in colors.json into MongoDB.
// Run with `npm run seed`. It uses the database in .env (MONGODB_URI).
//
// The two files are notes, so the seed turns them into what the app saves:
// - the objects are written back to back, so they're read as one list
// - hexcodes is one comma string, so it's split into a list, and NumberofColors counts it
// - each color says its pallette's name, so the seed puts that pallette's _id there instead
//
// A pallette that's already in the database (same name) is skipped, with its colors,
// so running the seed again doesn't add anything twice.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Pallette = require('../models/Pallettes');
const Color = require('../models/Colors');

// Read a file of JSON objects written back to back: { ... } { ... }
const readObjects = (file) => {
    const text = fs.readFileSync(path.join(__dirname, file), 'utf8').trim();
    return JSON.parse(`[${text.replace(/}\s*{/g, '},{')}]`);
};

const seed = async () => {
    const pallettes = readObjects('pallettes.json');
    const colors = readObjects('colors.json');

    // A color whose pallette isn't in pallettes.json would never be added.
    for (const color of colors) {
        if (!pallettes.some((pallette) => pallette.name === color.pallette)) {
            throw new Error(`${color.name} is in "${color.pallette}", which isn't in pallettes.json`);
        }
    }

    await connectDB();
    for (const { name, Description, colorTypes, hexcodes } of pallettes) {
        if (await Pallette.exists({ name })) {
            console.log(`Skipped ${name}: it's already in the database`);
            continue;
        }

        // "#FF0000, #FFFFFF" -> ["#FF0000", "#FFFFFF"]
        const hexcodeList = hexcodes.split(',').map((code) => code.trim()).filter(Boolean);
        const pallette = await Pallette.create({
            name,
            Description,
            colorTypes,
            hexcodes: hexcodeList,
            NumberofColors: hexcodeList.length,
        });

        // This pallette's colors, with its _id in place of its name.
        const palletteColors = colors
            .filter((color) => color.pallette === name)
            .map((color) => ({
                name: color.name,
                colorType: color.colorType,
                hexcode: color.hexcode,
                opacity: color.opacity,
                pallette: pallette._id,
            }));

        try {
            await Color.insertMany(palletteColors);
        } catch (error) {
            // Don't leave half a pallette behind, so the seed can run again after a fix.
            await Color.deleteMany({ pallette: pallette._id });
            await Pallette.deleteOne({ _id: pallette._id });
            throw error;
        }
        console.log(`Added ${name} with ${palletteColors.length} colors`);
    }
};

seed()
    .catch((error) => {
        console.error('Seed failed:', error.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
