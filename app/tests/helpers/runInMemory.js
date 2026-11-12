// The mocked services' version of app/services/runPipeline.js. It runs the same
// steps (filter, sort, skip, limit and select) on plain objects, in the order
// they're in, and follows MongoDB's rules for arrays, so mocked and real results match.

// IDs in the steps are ObjectIds, and IDs in the test data are strings.
const plain = (value) => (typeof value?.toHexString === 'function' ? value.toHexString() : value);
// Compare dates as times. The test data keeps dates as strings.
const valueOf = (value, isDate) => (isDate ? new Date(value).getTime() : plain(value));

const compare = (a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
};

const OPERATORS = {
    $eq: (value, target) => value === target,
    $gt: (value, target) => value > target,
    $gte: (value, target) => value >= target,
    $lt: (value, target) => value < target,
    $lte: (value, target) => value <= target,
    $in: (value, targets) => targets.includes(value),
};

// Does a field pass one operator? An array passes when any item in it does,
// like in MongoDB. $ne and $nin are the opposite of $eq and $in.
const passes = (fieldValue, operator, target) => {
    if (operator === '$ne') return !passes(fieldValue, '$eq', target);
    if (operator === '$nin') return !passes(fieldValue, '$in', target);

    const isDate = [target].flat().some((item) => item instanceof Date);
    const wanted = Array.isArray(target) ? target.map((item) => valueOf(item, isDate)) : valueOf(target, isDate);
    const items = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
    return items.some((item) => item !== undefined && OPERATORS[operator](valueOf(item, isDate), wanted));
};

// Does a document match the whole filter? Every field has to pass, and so does
// every part of an $and.
const matches = (doc, filter) => Object.entries(filter).every(([key, condition]) => (
    key === '$and'
        ? condition.every((part) => matches(doc, part))
        : Object.entries(condition).every(([operator, target]) => passes(doc[key], operator, target))
));

// MongoDB sorts an array by its smallest item going up, and its largest going down.
const sortValue = (value, direction) => {
    if (!Array.isArray(value)) return value;
    const items = [...value].sort(compare);
    return direction === 1 ? items[0] : items[items.length - 1];
};

// Sort by each field in order. The next field only matters when there's a tie.
const sortDocs = (docs, sort) => [...docs].sort((a, b) => {
    for (const [field, direction] of Object.entries(sort)) {
        const difference = compare(sortValue(a[field], direction), sortValue(b[field], direction));
        if (difference !== 0) return difference * direction;
    }
    return 0;
});

// Keep the fields a select shows ({ name: 1 }), or drop the ones it leaves out ({ pallette: 0 }).
// Showing fields always keeps _id, unless it says _id: 0.
const project = (doc, select) => {
    const shows = Object.values(select).includes(1);
    const keep = (key) => (shows
        ? select[key] === 1 || (key === '_id' && select._id !== 0)
        : select[key] !== 0);
    return Object.fromEntries(Object.entries(doc).filter(([key]) => keep(key)));
};

// Each step works on what the step before it left.
const runSteps = (docs, steps) => steps.reduce((list, step) => {
    if ('filter' in step) return list.filter((doc) => matches(doc, step.filter));
    if ('sort' in step) return sortDocs(list, step.sort);
    // A page step has a limit too, so it's checked first.
    if ('page' in step) return list.slice((step.page - 1) * step.limit, step.page * step.limit);
    if ('skip' in step) return list.slice(step.skip);
    if ('limit' in step) return list.slice(0, step.limit);
    return list.map((doc) => project(doc, step.select));
}, docs);

// How many documents the filters in these steps match.
const countMatches = (docs, steps) => runSteps(docs, steps.filter((step) => 'filter' in step)).length;

// Same answer as runPipeline: the documents left after every step, how many
// match the filters (skip, limit and page don't count), and with a page, how
// many the filters before it left to split into pages.
const runInMemory = (docs, steps) => {
    const page = steps.findIndex((step) => 'page' in step);
    return {
        data: runSteps(docs, steps),
        total: countMatches(docs, steps),
        pageTotal: page === -1 ? undefined : countMatches(docs, steps.slice(0, page)),
    };
};

module.exports = runInMemory;
