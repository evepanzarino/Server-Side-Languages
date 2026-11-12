// Runs the steps from a getAll query string (app/utils/queryPipeline.js) as a
// MongoDB aggregation pipeline: 
// one stage per step, in the same order, so each step works on what the step before it left.
// this is how query string can be arranged to work aggragated together in whatever order.
// How its written: localhost:3000/pallettes/?sort=name&limit=3
const STAGES = {
    filter: '$match',
    sort: '$sort',
    skip: '$skip',
    limit: '$limit',
    select: '$project',
};

// { filter: { opacity: { $gte: 50 } } } -> [{ $match: { opacity: { $gte: 50 } } }]
// A page step is 2 stages: { page: 3, limit: 5 } -> [{ $skip: 10 }, { $limit: 5 }]
const toStages = (step) => {
    if ('page' in step) return [{ $skip: (step.page - 1) * step.limit }, { $limit: step.limit }];
    const name = Object.keys(STAGES).find((key) => key in step);
    return [{ [STAGES[name]]: step[name] }];
};

// How many documents the filters in these steps match. skip, limit and page don't count.
const countMatches = async (Model, steps) => {
    const filters = steps.filter((step) => 'filter' in step).flatMap(toStages);
    const [counted] = await Model.aggregate([...filters, { $count: 'total' }]);
    return counted?.total ?? 0;
};

const runPipeline = async (Model, steps, populate) => {
    const page = steps.findIndex((step) => 'page' in step);
    const [data, total, pageTotal] = await Promise.all([
        // $unset leaves __v out of every document.
        Model.aggregate([...steps.flatMap(toStages), { $unset: '__v' }]),
        countMatches(Model, steps),
        // The pages are made from what the filters before page left.
        page === -1 ? undefined : countMatches(Model, steps.slice(0, page)),
    ]);

    // populate() only fills in documents that still have the field after select.
    if (populate) await Model.populate(data, populate);
    return { data, total, pageTotal };
};

module.exports = runPipeline;
