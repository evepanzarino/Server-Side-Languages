// Unit tests for app/utils/queryPipeline.js: how a query string becomes the
// steps for one MongoDB pipeline. No database or services, so no mocks needed.
const mongoose = require("mongoose")
const { queryPipeline, pagination } = require("../utils/queryPipeline")
const Pallette = require("../models/Pallettes")
const Color = require("../models/Colors")
const GeoData = require("../models/GeoData")

// A pretend request. queryPipeline only needs the URL.
const fakeRequest = (url) => ({ originalUrl: url })
const pipelineFor = (url, schema = Color.schema, settings) => queryPipeline(fakeRequest(url), schema, settings)
// The steps the way the API sends them back, with IDs and dates as text.
const stepsFor = (...args) => JSON.parse(JSON.stringify(pipelineFor(...args)))

const DEFAULT_SORT = { sort: { _id: 1 }, default: true }
const DEFAULT_LIMIT = { limit: 10, default: true }

describe("queryPipeline", () => {

    test("no query string: the default sort, then the first 10", () => {
        expect(stepsFor("/colors")).toEqual([DEFAULT_SORT, DEFAULT_LIMIT])
    })

    describe("every step runs in the order it's written", () => {

        test("sort then limit, or limit then sort", () => {
            expect(stepsFor("/colors?sort=-opacity&limit=3")).toEqual([
                { sort: { opacity: -1, _id: 1 } },
                { limit: 3 },
            ])
            expect(stepsFor("/colors?limit=3&sort=-opacity")).toEqual([
                DEFAULT_SORT,
                { limit: 3 },
                { sort: { opacity: -1, _id: 1 } },
            ])
        })

        test("skip then limit, or limit then skip", () => {
            expect(stepsFor("/colors?skip=2&limit=5")).toEqual([DEFAULT_SORT, { skip: 2 }, { limit: 5 }])
            expect(stepsFor("/colors?limit=5&skip=2")).toEqual([DEFAULT_SORT, { limit: 5 }, { skip: 2 }])
        })

        test("all five in a mixed-up order", () => {
            expect(stepsFor("/colors?select=name,opacity&opacity[gte]=50&sort=-opacity,name&skip=2&limit=3")).toEqual([
                { select: { name: 1, opacity: 1 } },
                { filter: { opacity: { $gte: 50 } } },
                { sort: { opacity: -1, name: 1, _id: 1 } },
                { skip: 2 },
                { limit: 3 },
            ])
        })

        test("filters next to each other share a step, and a filter after another step starts a new one", () => {
            expect(stepsFor("/colors?opacity[gte]=50&opacity[lt]=100&limit=5&colorType=red")).toEqual([
                DEFAULT_SORT,
                { filter: { opacity: { $gte: 50, $lt: 100 } } },
                { limit: 5 },
                { filter: { colorType: { $eq: "red" } } },
            ])
        })

        test("a step can be written more than once", () => {
            expect(stepsFor("/colors?sort=name&limit=5&sort=-opacity&limit=2")).toEqual([
                { sort: { name: 1, _id: 1 } },
                { limit: 5 },
                { sort: { opacity: -1, _id: 1 } },
                { limit: 2 },
            ])
        })
    })

    describe("the steps that get added", () => {

        test("the default sort goes first when no sort comes before the first skip or limit", () => {
            expect(stepsFor("/colors?opacity[gt]=5")).toEqual([DEFAULT_SORT, { filter: { opacity: { $gt: 5 } } }, DEFAULT_LIMIT])
            expect(stepsFor("/pallettes?skip=1&sort=name", Pallette.schema, { defaultSort: "name" })[0])
                .toEqual({ sort: { name: 1, _id: 1 }, default: true })
            expect(stepsFor("/api/geo-data", GeoData.schema, { defaultSort: "-observedAt" })[0])
                .toEqual({ sort: { observedAt: -1, _id: 1 }, default: true })
        })

        test("no default sort when a sort comes before the first skip or limit", () => {
            expect(stepsFor("/colors?sort=name&skip=1")).toEqual([{ sort: { name: 1, _id: 1 } }, { skip: 1 }, DEFAULT_LIMIT])
        })

        test("a limit anywhere means limit=10 isn't added", () => {
            expect(stepsFor("/colors?limit=50&sort=name")).toEqual([DEFAULT_SORT, { limit: 50 }, { sort: { name: 1, _id: 1 } }])
        })
    })

    describe("page", () => {

        test("page is one step with 10 to a page, and limit=10 isn't added after it", () => {
            expect(stepsFor("/colors?page=3")).toEqual([DEFAULT_SORT, { page: 3, limit: 10 }])
        })

        test("limit is the page size wherever it's written, not a step of its own", () => {
            expect(stepsFor("/colors?page=2&limit=5")).toEqual([DEFAULT_SORT, { page: 2, limit: 5 }])
            expect(stepsFor("/colors?limit=5&sort=-opacity&page=2")).toEqual([
                { sort: { opacity: -1, _id: 1 } },
                { page: 2, limit: 5 },
            ])
        })

        test("page goes where it's written, like the other steps", () => {
            expect(stepsFor("/colors?opacity[gte]=50&page=1&select=name")).toEqual([
                DEFAULT_SORT,
                { filter: { opacity: { $gte: 50 } } },
                { page: 1, limit: 10 },
                { select: { name: 1 } },
            ])
        })

        test("pagination() gives the page numbers and links, or nothing without a page", () => {
            const url = "/colors?hexcode=%23ff4500&page=2&limit=5"
            expect(pagination(fakeRequest(url), pipelineFor(url), 11)).toEqual({
                page: 2,
                limit: 5,
                totalPages: 3,
                prev: "/colors?hexcode=%23ff4500&page=1&limit=5",
                next: "/colors?hexcode=%23ff4500&page=3&limit=5",
            })
            expect(pagination(fakeRequest("/colors?page=1"), pipelineFor("/colors?page=1"), 0))
                .toEqual({ page: 1, limit: 10, totalPages: 0, prev: null, next: null })
            expect(pagination(fakeRequest("/colors?limit=5"), pipelineFor("/colors?limit=5"), 11)).toBeUndefined()
        })
    })

    describe("filters", () => {

        test("a field with no operator means equal to (eq)", () => {
            expect(stepsFor("/colors?name=Gold")[1]).toEqual({ filter: { name: { $eq: "Gold" } } })
        })

        test("values are changed to the field's type", () => {
            const [, { filter }] = pipelineFor("/colors?opacity[lte]=40&pallette=A00000000000000000000001")
            expect(filter.opacity).toEqual({ $lte: 40 })
            expect(filter.pallette.$eq).toBeInstanceOf(mongoose.Types.ObjectId)
            expect(filter.pallette.$eq.toHexString()).toBe("a00000000000000000000001")

            const [, geo] = pipelineFor("/api/geo-data?observedAt[gte]=2026-10-01&latitude[lt]=30.5", GeoData.schema)
            expect(geo.filter).toEqual({ observedAt: { $gte: new Date("2026-10-01") }, latitude: { $lt: 30.5 } })
        })

        test("text is trimmed and lowercased like the schema does when it saves", () => {
            expect(stepsFor("/colors?colorType=%20RED%20")[1]).toEqual({ filter: { colorType: { $eq: "red" } } })
        })

        test("in and nin take a comma list, and writing one twice in a row adds to its list", () => {
            expect(stepsFor("/colors?colorType[in]=red&colorType[in]=blue,green&name[nin]=Gold,Moss")[1]).toEqual({
                filter: {
                    colorType: { $in: ["red", "blue", "green"] },
                    name: { $nin: ["Gold", "Moss"] },
                },
            })
        })

        test("the same field and operator twice go into $and, in the order written", () => {
            expect(stepsFor("/colors?name[ne]=Red&opacity[gt]=10&name[ne]=Black")[1]).toEqual({
                filter: {
                    $and: [
                        { name: { $ne: "Red" } },
                        { opacity: { $gt: 10 } },
                        { name: { $ne: "Black" } },
                    ],
                },
            })
        })

        test("field names and operators don't care about case, and the $ is optional", () => {
            expect(stepsFor("/pallettes?numberofcolors[GTE]=3&name[$ne]=Sunset", Pallette.schema)[1]).toEqual({
                filter: { NumberofColors: { $gte: 3 }, name: { $ne: "Sunset" } },
            })
        })
    })

    describe("sort and select", () => {

        test("sort fields go in the order written, and _id breaks any ties", () => {
            expect(Object.keys(pipelineFor("/colors?sort=-opacity,name")[0].sort)).toEqual(["opacity", "name", "_id"])
            expect(stepsFor("/colors?sort=-_id")[0]).toEqual({ sort: { _id: -1 } })
        })

        test("select shows fields (and _id), or leaves fields out with a -", () => {
            expect(stepsFor("/colors?select=name,hexcode")[1]).toEqual({ select: { name: 1, hexcode: 1 } })
            expect(stepsFor("/colors?select=-pallette,-hexcode")[1]).toEqual({ select: { pallette: 0, hexcode: 0 } })
            expect(stepsFor("/colors?select=name,-_id")[1]).toEqual({ select: { name: 1, _id: 0 } })
        })

        test("a sort after a select that left _id out has no _id to break ties", () => {
            expect(stepsFor("/colors?sort=name&select=name,-_id&sort=-name")[2]).toEqual({ sort: { name: -1 } })
        })
    })

    describe("a query string that can't run throws a 400", () => {

        test.each([
            ["/colors?opacity[gte]=abc", 'opacity[gte] must be a number (got "abc")'],
            ["/colors?opacity[gte]=", "opacity[gte] needs a value"],
            ["/colors?opacity[like]=5", "like is not a query operator. Use one of: eq, ne, gt, gte, lt, lte, in, nin"],
            ["/colors?opacity[]=5", "opacity[] is not something a query string can use"],
            ["/colors?shade=red", '"shade" is not a field. Use one of: name, colorType, hexcode, opacity, pallette, _id'],
            ["/colors?sort=name,name", "sort has name in it more than once"],
            ["/colors?select=name,-opacity", "select can list fields to show, or fields to leave out with a -, but not both"],
            ["/colors?select=name&sort=opacity", "sort uses opacity, but a select before it left opacity out"],
            ["/colors?select=-opacity&opacity[gt]=5", "opacity[gt] uses opacity, but a select before it left opacity out"],
            ["/colors?limit=abc", "limit must be a whole number from 1 to 100"],
            ["/colors?limit=0", "limit must be a whole number from 1 to 100"],
            ["/colors?skip=-1", "skip must be a whole number, 0 or more"],
            ["/colors?page=1.5", "page must be a whole number, 1 or more"],
            ["/colors?skip=5&page=2", "page does the skipping, so use page or skip, not both"],
            ["/colors?page=2&limit=5&limit=6", "limit is in the query string more than once"],
            ["/colors?page=2&limit=500", "limit must be a whole number from 1 to 100"],
            ["/colors?skip=99999999999999999999", "skip must be a whole number, 0 or more"],
            ["/colors?pallette=xyz", 'pallette must be a MongoDB ID (got "xyz")'],
            ["/api/geo-data?observedAt[gte]=someday", 'observedAt[gte] must be a date, like 2026-11-15 (got "someday")'],
        ])("%s", (url, message) => {
            const schema = url.startsWith("/api") ? GeoData.schema : Color.schema
            expect(() => pipelineFor(url, schema)).toThrow(expect.objectContaining({ name: "HttpError", status: 400, message }))
        })
    })
})
