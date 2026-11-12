// Jest + Supertest tests for the query strings on GET /pallettes (3.6).
// npm test uses the mocked pallette service. npm run test:real runs the same
// tests without the mock, on a MongoDB test database with the same data.
const { useMocks, startDatabase, stopDatabase } = require("./helpers/testDatabase")
if (useMocks) {
    jest.mock("../services/palletteService")
}

const request = require("supertest")
const app = require("../index")

beforeAll(() => startDatabase("pallettes"))
afterAll(() => stopDatabase())

// The pallette names in a response, in order.
const names = (res) => res.body.data.map((pallette) => pallette.name)

describe("GET /pallettes with a query string", () => {

    describe("query operators and select return limited data", () => {

        test("NumberofColors[gte]=3&NumberofColors[lte]=5 with select=name,NumberofColors", async () => {
            const res = await request(app).get("/pallettes?NumberofColors[gte]=3&NumberofColors[lte]=5&select=name,NumberofColors")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Get all pallettes")
            expect(names(res)).toEqual(["Forest", "Ocean", "Sunset"])
            res.body.data.forEach((pallette) => {
                expect(Object.keys(pallette).sort()).toEqual(["NumberofColors", "_id", "name"])
                expect(pallette.NumberofColors).toBeGreaterThanOrEqual(3)
                expect(pallette.NumberofColors).toBeLessThanOrEqual(5)
            })
        })

        test("name[nin]=Sunset,Ocean&NumberofColors[lt]=10 with select=-hexcodes,-colorTypes", async () => {
            const res = await request(app).get("/pallettes?name[nin]=Sunset,Ocean&NumberofColors[lt]=10&select=-hexcodes,-colorTypes")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Forest", "Monochrome", "Pastels"])
            res.body.data.forEach((pallette) => {
                expect(Object.keys(pallette).sort()).toEqual(["Description", "NumberofColors", "_id", "name"])
            })
        })
    })

    describe("skip and limit", () => {

        test("limit=2 returns the first 2 pallettes", async () => {
            const res = await request(app).get("/pallettes?limit=2")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Forest", "Monochrome"])
            expect(res.body.count).toBe(2)
            expect(res.body.total).toBe(6)
        })

        test("skip=2&limit=2 skips the first 2 pallettes", async () => {
            const res = await request(app).get("/pallettes?skip=2&limit=2")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Ocean", "Pastels"])
            expect(res.body.count).toBe(2)
            expect(res.body.total).toBe(6)
        })

        test("skip=4 with no limit returns the rest, up to 10", async () => {
            const res = await request(app).get("/pallettes?skip=4")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Shades of Red", "Sunset"])
            expect(res.body.query[res.body.query.length - 1]).toEqual({ limit: 10, default: true })
        })
    })

    describe("sort in both directions", () => {

        test("sort=NumberofColors goes from fewest to most colors", async () => {
            const res = await request(app).get("/pallettes?sort=NumberofColors&select=name,NumberofColors")

            expect(res.status).toBe(200)
            expect(res.body.data.map((pallette) => pallette.NumberofColors)).toEqual([2, 3, 4, 5, 6, 15])
            expect(names(res)).toEqual(["Monochrome", "Sunset", "Ocean", "Forest", "Pastels", "Shades of Red"])
        })

        test("sort=-NumberofColors goes from most to fewest colors", async () => {
            const res = await request(app).get("/pallettes?sort=-NumberofColors&select=name,NumberofColors")

            expect(res.status).toBe(200)
            expect(res.body.data.map((pallette) => pallette.NumberofColors)).toEqual([15, 6, 5, 4, 3, 2])
            expect(names(res)).toEqual(["Shades of Red", "Pastels", "Forest", "Ocean", "Sunset", "Monochrome"])
        })

        test("no sort is A to Z by name, and sort=-name is Z to A", async () => {
            const aToZ = await request(app).get("/pallettes?select=name")
            const zToA = await request(app).get("/pallettes?sort=-name&select=name")

            expect(names(aToZ)).toEqual(["Forest", "Monochrome", "Ocean", "Pastels", "Shades of Red", "Sunset"])
            expect(names(zToA)).toEqual(["Sunset", "Shades of Red", "Pastels", "Ocean", "Monochrome", "Forest"])
        })
    })

    describe("every operation runs in the order it's written", () => {

        test("sort then limit keeps the 2 with the most colors, limit then sort sorts the first 2", async () => {
            const sortFirst = await request(app).get("/pallettes?sort=-NumberofColors&limit=2&select=name,NumberofColors")
            const limitFirst = await request(app).get("/pallettes?limit=2&sort=-NumberofColors&select=name,NumberofColors")

            expect(names(sortFirst)).toEqual(["Shades of Red", "Pastels"])
            // The first 2 by name are Forest (5) and Monochrome (2), then they're sorted.
            expect(names(limitFirst)).toEqual(["Forest", "Monochrome"])
        })

        test("skip then limit is not the same as limit then skip", async () => {
            const skipFirst = await request(app).get("/pallettes?skip=1&limit=3&select=name")
            const limitFirst = await request(app).get("/pallettes?limit=3&skip=1&select=name")

            expect(names(skipFirst)).toEqual(["Monochrome", "Ocean", "Pastels"])
            expect(names(limitFirst)).toEqual(["Monochrome", "Ocean"])
        })

        test("a filter before a limit is not the same as a filter after it", async () => {
            const filterFirst = await request(app).get("/pallettes?NumberofColors[gt]=4&limit=2&select=name")
            const limitFirst = await request(app).get("/pallettes?limit=2&NumberofColors[gt]=4&select=name")

            expect(names(filterFirst)).toEqual(["Forest", "Pastels"])
            // The first 2 by name are Forest and Monochrome, and only Forest has over 4.
            expect(names(limitFirst)).toEqual(["Forest"])
            // total counts every pallette the filter matches, without skip and limit.
            expect(filterFirst.body.total).toBe(3)
            expect(limitFirst.body.total).toBe(3)
        })

        test("all five in a mixed-up order, each working on what the step before it left", async () => {
            const res = await request(app).get("/pallettes?select=name,NumberofColors&sort=-NumberofColors&skip=1&NumberofColors[lt]=6&limit=2")

            // Most colors first, skip Shades of Red, keep the ones under 6, then the first 2.
            expect(res.status).toBe(200)
            expect(res.body.data).toEqual([
                { _id: "a00000000000000000000004", name: "Forest", NumberofColors: 5 },
                { _id: "a00000000000000000000003", name: "Ocean", NumberofColors: 4 },
            ])
            expect(res.body.query).toEqual([
                { select: { name: 1, NumberofColors: 1 } },
                { sort: { NumberofColors: -1, _id: 1 } },
                { skip: 1 },
                { filter: { NumberofColors: { $lt: 6 } } },
                { limit: 2 },
            ])
            expect(res.body.count).toBe(2)
            expect(res.body.total).toBe(4)
        })

        test("a step can't use a field that a select before it left out", async () => {
            const selectFirst = await request(app).get("/pallettes?select=name&sort=NumberofColors")
            const sortFirst = await request(app).get("/pallettes?sort=NumberofColors&select=name")

            expect(selectFirst.status).toBe(400)
            expect(selectFirst.body.message).toBe("sort uses NumberofColors, but a select before it left NumberofColors out")
            expect(sortFirst.status).toBe(200)
            expect(names(sortFirst)).toEqual(["Monochrome", "Sunset", "Ocean", "Forest", "Pastels", "Shades of Red"])
        })
    })

    describe("pagination with page", () => {

        test("page=1 is the first 10, and 6 pallettes fit on 1 page", async () => {
            const res = await request(app).get("/pallettes?page=1")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Forest", "Monochrome", "Ocean", "Pastels", "Shades of Red", "Sunset"])
            expect(res.body.pagination).toEqual({ page: 1, limit: 10, totalPages: 1, prev: null, next: null })
        })

        test("page=2&limit=2 is pallettes 3 and 4, with links to pages 1 and 3", async () => {
            const res = await request(app).get("/pallettes?page=2&limit=2")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Ocean", "Pastels"])
            expect(res.body.query).toEqual([
                { sort: { name: 1, _id: 1 }, default: true },
                { page: 2, limit: 2 },
            ])
            expect(res.body.pagination).toEqual({
                page: 2,
                limit: 2,
                totalPages: 3,
                prev: "/pallettes?page=1&limit=2",
                next: "/pallettes?page=3&limit=2",
            })
        })

        test("the last page has no next, and limit can come before page", async () => {
            const res = await request(app).get("/pallettes?limit=2&page=3")

            expect(names(res)).toEqual(["Shades of Red", "Sunset"])
            expect(res.body.pagination.prev).toBe("/pallettes?limit=2&page=2")
            expect(res.body.pagination.next).toBeNull()
        })

        test("a filter and sort before page decide what gets split into pages", async () => {
            const res = await request(app).get("/pallettes?NumberofColors[gte]=3&sort=-NumberofColors&page=2&limit=2&select=name")

            // 3 or more colors, most first: Shades of Red, Pastels, Forest, Ocean, Sunset.
            expect(names(res)).toEqual(["Forest", "Ocean"])
            expect(res.body.total).toBe(5)
            expect(res.body.pagination.totalPages).toBe(3)
        })

        test("a page past the end is empty and links back to the last page", async () => {
            const res = await request(app).get("/pallettes?page=5&limit=2")

            expect(res.status).toBe(200)
            expect(res.body.data).toEqual([])
            expect(res.body.pagination).toEqual({ page: 5, limit: 2, totalPages: 3, prev: "/pallettes?page=3&limit=2", next: null })
        })

        test("no page means no pagination part", async () => {
            const res = await request(app).get("/pallettes?limit=2")

            expect(res.body).not.toHaveProperty("pagination")
        })
    })

    describe("a query string that can't run gets a 400", () => {

        test.each([
            ["NumberofColors[gte]=lots", 'NumberofColors[gte] must be a number (got "lots")'],
            ["color=red", '"color" is not a field. Use one of: name, Description, colorTypes, hexcodes, NumberofColors, _id'],
            ["NumberofColors[between]=2", "between is not a query operator. Use one of: eq, ne, gt, gte, lt, lte, in, nin"],
            ["select=name,-hexcodes", "select can list fields to show, or fields to leave out with a -, but not both"],
            ["limit=101", "limit must be a whole number from 1 to 100"],
            ["skip=-1", "skip must be a whole number, 0 or more"],
            ["page=0", "page must be a whole number, 1 or more"],
            ["page=2&skip=2", "page does the skipping, so use page or skip, not both"],
        ])("?%s", async (queryString, message) => {
            const res = await request(app).get(`/pallettes?${queryString}`)

            expect(res.status).toBe(400)
            expect(res.body.message).toBe(message)
        })
    })
})
