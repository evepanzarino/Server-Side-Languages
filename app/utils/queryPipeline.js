// Query strings for the getAll routes. queryPipeline() turns the query string
// into a list of steps, and the steps run in the order they're written:
//
//   filter  opacity[gte]=50&opacity[lt]=100   keep the documents that match
//   sort    sort=-opacity,name                opacity high to low, then name A to Z
//   skip    skip=5                            drop the first 5
//   limit   limit=5                           keep the first 5
//   page    page=2&limit=5                    page 2, 5 to a page (10 when there's no limit)
//   select  select=name,hexcode               show only these fields (select=-pallette leaves one out)
//
// Each step works on what the step before it left. So sort=-opacity&limit=3
// is the 3 most solid colors, and limit=3&sort=-opacity is the first 3 colors, sorted.
//
// With page, limit is the page size instead of a step of its own, and skip
// can't be used, since page does the skipping.
//
// Two steps are added when they're needed:
// - If no sort comes before the first skip, limit or page, the default sort goes first, so they always pick the same documents.
// - If there's no limit, limit=10 goes last, so a response has 10 documents at most.
const mongoose = require('mongoose');
const messages = require('../messages/messages');
const httpError = require('./httpError');

// The query operators a filter can use, like opacity[gte]=50.
const OPERATORS = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin'];
// A filter key is a field, then an operator in brackets. No brackets means eq.
const FILTER_KEY = /^(\w+)(?:\[\$?(\w+)\])?$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// A number too big for MongoDB to skip gets a 400 instead of a 500.
const NUMBER_RULES = {
    skip: { min: 0, max: Number.MAX_SAFE_INTEGER, message: messages.QUERY_SKIP_INVALID },
    limit: { min: 1, max: MAX_LIMIT, message: messages.QUERY_LIMIT_INVALID(MAX_LIMIT) },
    page: { min: 1, max: Number.MAX_SAFE_INTEGER, message: messages.QUERY_PAGE_INVALID },
};

// skip, limit and page take a whole number: "5" -> 5.
const wholeNumber = (key, value) => {
    const { min, max, message } = NUMBER_RULES[key];
    const number = Number(value);
    if (!/^\d+$/.test(value) || number < min || number > max) throw httpError(400, message);
    return number;
};

// The query string as [key, value] pairs, in the order they were written.
const searchParams = (req) => {
    const start = req.originalUrl.indexOf('?');
    return new URLSearchParams(start === -1 ? '' : req.originalUrl.slice(start + 1));
};

// "name, -opacity" -> ['name', '-opacity']
const listOf = (key, value) => {
    const items = value.split(',').map((item) => item.trim()).filter(Boolean);
    if (items.length === 0) throw httpError(400, messages.QUERY_EMPTY_VALUE(key));
    return items;
};

// Change a value from the query string ("50") to the field's type (50).
const castValue = (schema, field, key, value) => {
    const path = schema.path(field);
    const type = path.instance === 'Array' ? path.embeddedSchemaType : path;

    if (type.instance === 'Number') {
        const number = Number(value);
        if (value.trim() === '' || !Number.isFinite(number)) throw httpError(400, messages.QUERY_NOT_A_NUMBER(key, value));
        return number;
    }
    if (type.instance === 'Date') {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw httpError(400, messages.QUERY_NOT_A_DATE(key, value));
        return date;
    }
    if (type.instance === 'ObjectId') {
        if (!mongoose.isObjectIdOrHexString(value)) throw httpError(400, messages.QUERY_NOT_AN_ID(key, value));
        return new mongoose.Types.ObjectId(value);
    }
    // Text gets the same trim and lowercase the schema gives it when it's saved.
    let text = type.options.trim ? value.trim() : value;
    if (type.options.lowercase) text = text.toLowerCase();
    if (type.options.uppercase) text = text.toUpperCase();
    return text;
};

// Turn a filter step's conditions into one MongoDB filter, like
// { opacity: { $gte: 50, $lt: 100 } }. If the same field and operator are used
// twice (name[ne]=Red&name[ne]=Black), they can't share an object, so each
// condition goes into $and, in the order written.
const toMongoFilter = (conditions) => {
    const pairs = conditions.map(({ field, operator }) => `${field}[${operator}]`);
    if (new Set(pairs).size < pairs.length) {
        return { $and: conditions.map(({ field, operator, value }) => ({ [field]: { [`$${operator}`]: value } })) };
    }
    const filter = {};
    for (const { field, operator, value } of conditions) {
        filter[field] = { ...filter[field], [`$${operator}`]: value };
    }
    return filter;
};

// Read the query string in order and turn it into steps, like
// [{ filter }, { sort }, { skip }, { limit }, { select }] in any order.
// defaultSort is the sort to start with when one is needed, like 'name' or '-observedAt'.
const queryPipeline = (req, schema, { defaultSort = '_id' } = {}) => {
    // Every field in the model can be used, except __v.
    const fields = Object.keys(schema.paths).filter((field) => field !== '__v');
    // The fields still there after the steps so far. A select can leave some out.
    let available = new Set(fields);

    // Fields match without caring about case, so description finds Description.
    const findField = (key, name) => {
        const field = fields.find((f) => f.toLowerCase() === name.toLowerCase());
        if (!field) throw httpError(400, messages.QUERY_UNKNOWN_FIELD(name, fields));
        if (!available.has(field)) throw httpError(400, messages.QUERY_FIELD_LEFT_OUT(key, field));
        return field;
    };

    const steps = [];

    // sort=-opacity,name -> { opacity: -1, name: 1, _id: 1 }
    const sortStep = (key, value) => {
        const sort = [];
        for (const name of listOf(key, value)) {
            const field = findField(key, name.replace(/^[-+]/, ''));
            if (sort.some(([sorted]) => sorted === field)) throw httpError(400, messages.QUERY_SORT_TWICE(field));
            sort.push([field, name.startsWith('-') ? -1 : 1]);
        }
        // _id breaks any ties, so equal values always come out in the same order.
        if (available.has('_id') && !sort.some(([field]) => field === '_id')) sort.push(['_id', 1]);
        return { sort: Object.fromEntries(sort) };
    };

    // select=name,hexcode -> { name: 1, hexcode: 1 }, select=-pallette -> { pallette: 0 }
    const selectStep = (key, value) => {
        const shown = [];
        const hidden = [];
        for (const name of listOf(key, value)) {
            const field = findField(key, name.replace(/^[-+]/, ''));
            (name.startsWith('-') ? hidden : shown).push(field);
        }
        // MongoDB can't show some fields and hide others, except for hiding _id.
        if (shown.length > 0 && hidden.some((field) => field !== '_id' || shown.includes(field))) {
            throw httpError(400, messages.QUERY_SELECT_MIX);
        }
        if (shown.length > 0) {
            const select = Object.fromEntries(shown.map((field) => [field, 1]));
            if (hidden.includes('_id')) select._id = 0;
            available = new Set(hidden.includes('_id') ? shown : ['_id', ...shown]);
            return { select };
        }
        hidden.forEach((field) => available.delete(field));
        return { select: Object.fromEntries(hidden.map((field) => [field, 0])) };
    };

    // opacity[gte]=50 adds { field: 'opacity', operator: 'gte', value: 50 } to a filter step.
    // Filters written one after another share a step, since they all have to match.
    const addFilter = (key, value) => {
        const match = FILTER_KEY.exec(key);
        if (!match) throw httpError(400, messages.QUERY_BAD_KEY(key));
        const field = findField(key, match[1]);
        const operator = (match[2] || 'eq').toLowerCase();
        if (!OPERATORS.includes(operator)) throw httpError(400, messages.QUERY_UNKNOWN_OPERATOR(match[2]));

        let step = steps[steps.length - 1];
        if (!step || !('conditions' in step)) {
            step = { conditions: [] };
            steps.push(step);
        }

        // in and nin take a list, like colorType[in]=red,blue.
        if (operator === 'in' || operator === 'nin') {
            const values = listOf(key, value).map((item) => castValue(schema, field, key, item));
            // Writing the same one twice in a row adds to its list.
            const earlier = step.conditions.find((c) => c.field === field && c.operator === operator);
            if (earlier) earlier.value.push(...values);
            else step.conditions.push({ field, operator, value: values });
            return;
        }
        step.conditions.push({ field, operator, value: castValue(schema, field, key, value) });
    };

    const params = [...searchParams(req)];
    const usedTwice = (key) => params.filter(([k]) => k === key).length > 1;

    // With page, limit is the page size, so it's read before the loop.
    // page=2&limit=5 and limit=5&page=2 are the same page.
    const paged = params.some(([key]) => key === 'page');
    let pageSize = DEFAULT_LIMIT;
    if (paged) {
        if (usedTwice('page')) throw httpError(400, messages.QUERY_KEY_TWICE('page'));
        if (usedTwice('limit')) throw httpError(400, messages.QUERY_KEY_TWICE('limit'));
        if (params.some(([key]) => key === 'skip')) throw httpError(400, messages.QUERY_PAGE_AND_SKIP);
        const limit = params.find(([key]) => key === 'limit');
        if (limit) pageSize = wholeNumber('limit', limit[1]);
    }

    // Go through the query string in the order it was written.
    for (const [key, value] of params) {
        if (value === '') throw httpError(400, messages.QUERY_EMPTY_VALUE(key));

        if (key === 'sort') {
            steps.push(sortStep(key, value));
        } else if (key === 'select') {
            steps.push(selectStep(key, value));
        } else if (key === 'page') {
            // page=2 with 5 to a page -> { page: 2, limit: 5 }
            steps.push({ page: wholeNumber(key, value), limit: pageSize });
        } else if (key === 'limit' && paged) {
            // Already used as the page size.
        } else if (key === 'skip' || key === 'limit') {
            steps.push({ [key]: wholeNumber(key, value) });
        } else {
            addFilter(key, value);
        }
    }

    // No limit: show the first 10. A page step has its own limit.
    if (!steps.some((step) => 'limit' in step)) steps.push({ limit: DEFAULT_LIMIT, default: true });

    // No sort before the first skip, limit or page: start with the default sort.
    const firstSkipOrLimit = steps.findIndex((step) => 'skip' in step || 'limit' in step);
    if (!steps.slice(0, firstSkipOrLimit).some((step) => 'sort' in step)) {
        available = new Set(fields);
        steps.unshift({ ...sortStep('sort', defaultSort), default: true });
    }

    return steps.map((step) => ('conditions' in step ? { filter: toMongoFilter(step.conditions) } : step));
};

// The same URL with a different page number, so prev and next keep the rest
// of the query string just as it was written.
const pageLink = (req, page) => {
    if (page === null) return null;
    const start = req.originalUrl.indexOf('?');
    const parts = req.originalUrl.slice(start + 1).split('&')
        .map((part) => ([...new URLSearchParams(part).keys()][0] === 'page' ? `page=${page}` : part));
    return `${req.originalUrl.slice(0, start)}?${parts.join('&')}`;
};

// The "pagination" part of a getAll response when the query string has a page, like
// { page: 2, limit: 5, totalPages: 4, prev: '/colors?page=1&limit=5', next: '/colors?page=3&limit=5' }.
// pageTotal is how many documents there are to split into pages.
// No page in the query string means no pagination part.
const pagination = (req, steps, pageTotal) => {
    const step = steps.find((s) => 'page' in s);
    if (!step) return undefined;

    const { page, limit } = step;
    const totalPages = Math.ceil(pageTotal / limit);
    // A page past the end still links back to the last page.
    const prev = page > 1 && totalPages > 0 ? Math.min(page - 1, totalPages) : null;
    const next = page < totalPages ? page + 1 : null;
    return { page, limit, totalPages, prev: pageLink(req, prev), next: pageLink(req, next) };
};

module.exports = {
    queryPipeline,
    pagination,
    searchParams,
    OPERATORS,
    DEFAULT_LIMIT,
    MAX_LIMIT,
};
