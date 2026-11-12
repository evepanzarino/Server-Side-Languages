// Test data for the Jest tests. The mocked services read it from here, and
// `npm run test:real` saves the same data in a MongoDB test database, so the
// same tests pass both ways.
//
// The IDs are fixed so the tests can use them. Their first letter says what
// they are: a = pallette, c = color, e = geo data.

// 6 pallettes. By name: Forest, Monochrome, Ocean, Pastels, Shades of Red, Sunset.
// By NumberofColors: Monochrome 2, Sunset 3, Ocean 4, Forest 5, Pastels 6, Shades of Red 15.
const pallettes = [
    {
        _id: 'a00000000000000000000001',
        name: 'Shades of Red',
        Description: 'Different shades of red. Using pure red, black, & white together.',
        colorTypes: 'Red, White, Black',
        hexcodes: [
            '#FF0000', '#FFFFFF', '#000000', '#FF3333', '#FF6666',
            '#FF9999', '#FFCCCC', '#CC0000', '#990000', '#660000',
            '#330000', '#993333', '#A66666', '#661A1A', '#4D3333',
        ],
        NumberofColors: 15,
    },
    {
        _id: 'a00000000000000000000002',
        name: 'Sunset',
        Description: 'Warm sunset colors',
        colorTypes: 'red, orange, yellow',
        hexcodes: ['#ff4500', '#ffa500', '#ffd700'],
        NumberofColors: 3,
    },
    {
        _id: 'a00000000000000000000003',
        name: 'Ocean',
        Description: 'Cool blues and greens of the sea',
        colorTypes: 'blue, green',
        hexcodes: ['#006994', '#40e0d0', '#2e8b57', '#000080'],
        NumberofColors: 4,
    },
    {
        _id: 'a00000000000000000000004',
        name: 'Forest',
        Description: 'Greens and browns of the woods',
        colorTypes: 'green, brown',
        hexcodes: ['#228b22', '#8b4513', '#556b2f', '#a0522d', '#6b8e23'],
        NumberofColors: 5,
    },
    {
        _id: 'a00000000000000000000005',
        name: 'Monochrome',
        Description: 'Just black and white',
        colorTypes: 'black, white',
        hexcodes: ['#000000', '#ffffff'],
        NumberofColors: 2,
    },
    {
        _id: 'a00000000000000000000006',
        name: 'Pastels',
        Description: 'Soft, light colors',
        colorTypes: 'red, blue, yellow, green, purple',
        hexcodes: ['#ffd1dc', '#aec6cf', '#fdfd96', '#77dd77', '#b39eb5', '#ffb347'],
        NumberofColors: 6,
    },
];

// 14 colors. Each "pallette" is the _id of one of the pallettes above.
const colors = [
    { _id: 'c00000000000000000000001', name: 'Red', colorType: ['red'], hexcode: '#ff0000', opacity: 100, pallette: 'a00000000000000000000001' },
    { _id: 'c00000000000000000000002', name: 'Bright Red', colorType: ['red', 'white'], hexcode: '#ff3333', opacity: 90, pallette: 'a00000000000000000000001' },
    { _id: 'c00000000000000000000003', name: 'Pastel Red', colorType: ['red', 'white'], hexcode: '#ff9999', opacity: 60, pallette: 'a00000000000000000000001' },
    { _id: 'c00000000000000000000004', name: 'Dark Red', colorType: ['red', 'black'], hexcode: '#cc0000', opacity: 75, pallette: 'a00000000000000000000001' },
    { _id: 'c00000000000000000000005', name: 'Blood Red', colorType: ['red', 'black'], hexcode: '#660000', opacity: 40, pallette: 'a00000000000000000000001' },
    { _id: 'c00000000000000000000006', name: 'Sunset Orange', colorType: ['orange', 'red'], hexcode: '#ff4500', opacity: 80, pallette: 'a00000000000000000000002' },
    { _id: 'c00000000000000000000007', name: 'Gold', colorType: ['yellow'], hexcode: '#ffd700', opacity: 55, pallette: 'a00000000000000000000002' },
    { _id: 'c00000000000000000000008', name: 'Deep Sea', colorType: ['blue'], hexcode: '#000080', opacity: 100, pallette: 'a00000000000000000000003' },
    { _id: 'c00000000000000000000009', name: 'Turquoise', colorType: ['blue', 'green'], hexcode: '#40e0d0', opacity: 30, pallette: 'a00000000000000000000003' },
    { _id: 'c00000000000000000000010', name: 'Moss', colorType: ['green'], hexcode: '#556b2f', opacity: 65, pallette: 'a00000000000000000000004' },
    { _id: 'c00000000000000000000011', name: 'Bark', colorType: ['brown'], hexcode: '#8b4513', opacity: 85, pallette: 'a00000000000000000000004' },
    { _id: 'c00000000000000000000012', name: 'Black', colorType: ['black'], hexcode: '#000000', opacity: 100, pallette: 'a00000000000000000000005' },
    { _id: 'c00000000000000000000013', name: 'White', colorType: ['white'], hexcode: '#ffffff', opacity: 20, pallette: 'a00000000000000000000005' },
    { _id: 'c00000000000000000000014', name: 'Baby Blue', colorType: ['blue', 'white'], hexcode: '#aec6cf', opacity: 50, pallette: 'a00000000000000000000006' },
];

// 6 geo data entries from October 2026. Dates are written the way the API sends them back.
const geoReading = (id, name, latitude, longitude, elevation, timezone, temperature, humidity, windSpeed, weatherCode, conditions, observedAt) => ({
    _id: id,
    name,
    latitude,
    longitude,
    elevation,
    timezone,
    temperature,
    humidity,
    windSpeed,
    weatherCode,
    conditions,
    observedAt,
    createdAt: observedAt,
    updatedAt: observedAt,
});

const geoData = [
    geoReading('e00000000000000000000001', 'Orlando', 28.5383, -81.3792, 35, 'America/New_York', 27.1, 62, 12.4, 1, 'Mainly clear', '2026-10-05T16:00:00.000Z'),
    geoReading('e00000000000000000000002', 'Miami', 25.7617, -80.1918, 2, 'America/New_York', 29.4, 70, 18.2, 2, 'Partly cloudy', '2026-10-12T17:00:00.000Z'),
    geoReading('e00000000000000000000003', 'Tampa', 27.9506, -82.4572, 15, 'America/New_York', 26.3, 58, 9.7, 3, 'Overcast', '2026-10-19T15:00:00.000Z'),
    geoReading('e00000000000000000000004', 'New York', 40.7128, -74.006, 10, 'America/New_York', 14.2, 55, 20.5, 61, 'Slight rain', '2026-10-21T13:00:00.000Z'),
    geoReading('e00000000000000000000005', 'Denver', 39.7392, -104.9903, 1609, 'America/Denver', 9.8, 30, 15.1, 0, 'Clear sky', '2026-10-26T19:00:00.000Z'),
    geoReading('e00000000000000000000006', 'Anchorage', 61.2181, -149.9003, 31, 'America/Anchorage', -3.5, 80, 6.4, 71, 'Slight snow fall', '2026-10-30T21:00:00.000Z'),
];

module.exports = { pallettes, colors, geoData };
