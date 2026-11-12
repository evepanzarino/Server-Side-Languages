// Jest + Supertest tests for the query strings on GET /colors (3.6).
// npm test uses the mocked color service. npm run test:real runs the same
// tests without the mock, on a MongoDB test database with the same data.
const { useMocks, startDatabase, stopDatabase } = require("./helpers/testDatabase")
if (useMocks) {
    jest.mock("../services/colorService")
}

const request = require("supertest")
const app = require("../index")

beforeAll(() => startDatabase("colors"))
afterAll(() => stopDatabase())

// The color names in a response, in order.
const names = (res) => res.body.data.map((color) => color.name)

describe("GET /colors with a query string", () => {

    describe("query operators and select return limited data", () => {

        test("opacity[gte]=50&opacity[lt]=100 with select=name,opacity", async () => {
            const res = await request(app).get("/colors?opacity[gte]=50&opacity[lt]=100&select=name,opacity")

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Get all colors")
            expect(names(res)).toEqual(["Bright Red", "Pastel Red", "Dark Red", "Sunset Orange", "Gold", "Moss", "Bark", "Baby Blue"])
            res.body.data.forEach((color) => {
                // No pallette: select didn't keep it, so there's nothing to populate.
                expect(Object.keys(color).sort()).toEqual(["_id", "name", "opacity"])
                expect(color.opacity).toBeGreaterThanOrEqual(50)
                expect(color.opacity).toBeLessThan(100)
            })
        })

        test("colorType[in]=blue,green with select=-pallette,-hexcode", async () => {
            const res = await request(app).get("/colors?colorType[in]=blue,green&select=-pallette,-hexcode")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Deep Sea", "Turquoise", "Moss", "Baby Blue"])
            res.body.data.forEach((color) => {
                expect(Object.keys(color).sort()).toEqual(["_id", "colorType", "name", "opacity"])
                expect(color.colorType.some((type) => ["blue", "green"].includes(type))).toBe(true)
            })
        })

        test("select=name,pallette still shows each color's pallette with populate()", async () => {
            // colorType=Black finds "black", since the schema saves color types in lowercase.
            const res = await request(app).get("/colors?colorType=Black&select=name,pallette")

            expect(res.status).toBe(200)
            expect(res.body.data.map((color) => [color.name, color.pallette.name])).toEqual([
                ["Dark Red", "Shades of Red"],
                ["Blood Red", "Shades of Red"],
                ["Black", "Monochrome"],
            ])
            res.body.data.forEach((color) => {
                expect(Object.keys(color).sort()).toEqual(["_id", "name", "pallette"])
                expect(color.pallette).not.toHaveProperty("__v")
            })
        })
    })

    describe("skip and limit", () => {

        test("limit=5 returns the first 5 colors", async () => {
            const res = await request(app).get("/colors?limit=5")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Red", "Bright Red", "Pastel Red", "Dark Red", "Blood Red"])
            expect(res.body.count).toBe(5)
            expect(res.body.total).toBe(14)
            // With no select, every color has its whole pallette and no __v.
            res.body.data.forEach((color) => {
                expect(color).not.toHaveProperty("__v")
                expect(color.pallette.name).toBe("Shades of Red")
            })
        })

        test("skip=10&limit=5 skips the first 10 colors", async () => {
            const res = await request(app).get("/colors?skip=10&limit=5")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["Bark", "Black", "White", "Baby Blue"])
            expect(res.body.count).toBe(4)
            expect(res.body.total).toBe(14)
        })

        test("skip=12&limit=5 skips the first 12 colors", async () => {
            const res = await request(app).get("/colors?skip=12&limit=5")

            expect(res.status).toBe(200)
            expect(names(res)).toEqual(["White", "Baby Blue"])
        })
    })

    describe("sort in both directions", () => {

        test("sort=opacity goes from most see-through to most solid", async () => {
            const res = await request(app).get("/colors?sort=opacity&limit=14&select=name,opacity")

            expect(res.status).toBe(200)
            expect(res.body.data.map((color) => color.opacity)).toEqual([20, 30, 40, 50, 55, 60, 65, 75, 80, 85, 90, 100, 100, 100])
            expect(names(res)).toEqual([
                "White", "Turquoise", "Blood Red", "Baby Blue", "Gold", "Pastel Red", "Moss",
                "Dark Red", "Sunset Orange", "Bark", "Bright Red", "Red", "Deep Sea", "Black",
            ])
        })

        test("sort=-opacity goes from most solid to most see-through", async () => {
            const res = await request(app).get("/colors?sort=-opacity&limit=14&select=name,opacity")

            expect(res.status).toBe(200)
            expect(res.body.data.map((color) => color.opacity)).toEqual([100, 100, 100, 90, 85, 80, 75, 65, 60, 55, 50, 40, 30, 20])
            expect(names(res)).toEqual([
                "Red", "Deep Sea", "Black", "Bright Red", "Bark", "Sunset Orange", "Dark Red",
                "Moss", "Pastel Red", "Gold", "Baby Blue", "Blood Red", "Turquoise", "White",
            ])
        })

        test("sort=-opacity,name sorts by opacity first, then by name for ties", async () => {
            const opacityFirst = await request(app).get("/colors?sort=-opacity,name&limit=4&select=name,opacity")
            const nameFirst = await request(app).get("/colors?sort=name,-opacity&limit=4&select=name,opacity")

            expect(names(opacityFirst)).toEqual(["Black", "Deep Sea", "Red", "Bright Red"])
            expect(names(nameFirst)).toEqual(["Baby Blue", "Bark", "Black", "Blood Red"])
        })
    })

    describe("every operation runs in the order it's written", () => {

        test("sort then limit keeps the 3 most solid, limit then sort sorts the first 3", async () => {
            const sortFirst = await request(app).get("/colors?sort=-opacity&limit=3&select=name,opacity")
            const limitFirst = await request(app).get("/colors?limit=3&sort=-opacity&select=name,opacity")

            expect(names(sortFirst)).toEqual(["Red", "Deep Sea", "Black"])
            // The first 3 colors are Red (100), Bright Red (90) and Pastel Red (60), then they're sorted.
            expect(names(limitFirst)).toEqual(["Red", "Bright Red", "Pastel Red"])
        })

        test("skip then limit is not the same as limit then skip", async () => {
            const skipFirst = await request(app).get("/colors?skip=3&limit=5&select=name")
            const limitFirst = await request(app).get("/colors?limit=5&skip=3&select=name")

            expect(names(skipFirst)).toEqual(["Dark Red", "Blood Red", "Sunset Orange", "Gold", "Deep Sea"])
            expect(names(limitFirst)).toEqual(["Dark Red", "Blood Red"])
        })

        test("a filter before a limit is not the same as a filter after it", async () => {
            const filterFirst = await request(app).get("/colors?opacity[gte]=80&limit=3&select=name,opacity")
            const limitFirst = await request(app).get("/colors?limit=3&opacity[gte]=80&select=name,opacity")

            expect(names(filterFirst)).toEqual(["Red", "Bright Red", "Sunset Orange"])
            // Of the first 3 colors, Pastel Red (60) doesn't pass the filter.
            expect(names(limitFirst)).toEqual(["Red", "Bright Red"])
            expect(limitFirst.body.count).toBe(2)
            expect(limitFirst.body.total).toBe(6)
        })

        test("all five in a mixed-up order, each working on what the step before it left", async () => {
            const res = await request(app).get("/colors?select=name,opacity,pallette&opacity[gte]=50&sort=-opacity,name&skip=2&limit=3")

            // 11 colors have opacity 50 or more. Most solid first (Black, Deep Sea, Red,
            // Bright Red, Bark...), skip 2, then keep 3.
            expect(res.status).toBe(200)
            expect(res.body.data.map((color) => [color.name, color.opacity, color.pallette.name])).toEqual([
                ["Red", 100, "Shades of Red"],
                ["Bright Red", 90, "Shades of Red"],
                ["Bark", 85, "Forest"],
            ])
            expect(res.body.query).toEqual([
                { select: { name: 1, opacity: 1, pallette: 1 } },
                { filter: { opacity: { $gte: 50 } } },
                { sort: { opacity: -1, name: 1, _id: 1 } },
                { skip: 2 },
                { limit: 3 },
            ])
            expect(res.body.count).toBe(3)
            expect(res.body.total).toBe(11)
        })

        test("the same operator twice still runs both filters", async () => {
            const res = await request(app).get("/colors?name[ne]=Red&name[ne]=Black&limit=20&select=name")

            expect(res.status).toBe(200)
            expect(res.body.query[1]).toEqual({ filter: { $and: [{ name: { $ne: "Red" } }, { name: { $ne: "Black" } }] } })
            expect(res.body.total).toBe(12)
            expect(names(res)).not.toContain("Red")
            expect(names(res)).not.toContain("Black")
        })

        test("a step can't use a field that a select before it left out", async () => {
            const selectFirst = await request(app).get("/colors?select=name&opacity[gte]=50")
            const filterFirst = await request(app).get("/colors?opacity[gte]=50&select=name")

            expect(selectFirst.status).toBe(400)
            expect(selectFirst.body.message).toBe("opacity[gte] uses opacity, but a select before it left opacity out")
            expect(filterFirst.status).toBe(200)
            expect(filterFirst.body.count).toBe(10)
            expect(filterFirst.body.total).toBe(11)
        })
    })

    describe("pagination with page", () => {

        test("page=1 and page=2 split the 14 colors into 10 and 4", async () => {
            const page1 = await request(app).get("/colors?page=1&select=name")
            const page2 = await request(app).get("/colors?page=2&select=name")

            expect(page1.status).toBe(200)
            expect(page1.body.count).toBe(10)
            expect(page1.body.total).toBe(14)
            expect(page1.body.pagination).toEqual({ page: 1, limit: 10, totalPages: 2, prev: null, next: "/colors?page=2&select=name" })

            expect(names(page2)).toEqual(["Bark", "Black", "White", "Baby Blue"])
            expect(page2.body.pagination).toEqual({ page: 2, limit: 10, totalPages: 2, prev: "/colors?page=1&select=name", next: null })
        })

        test("a filter before page is not the same as a filter after it", async () => {
            const filterFirst = await request(app).get("/colors?opacity[gte]=50&page=2&limit=4&select=name")
            const pageFirst = await request(app).get("/colors?page=2&limit=4&opacity[gte]=50&select=name")

            // 11 colors have 50 or more, so 3 pages of 4.
            expect(names(filterFirst)).toEqual(["Sunset Orange", "Gold", "Deep Sea", "Moss"])
            expect(filterFirst.body.pagination.totalPages).toBe(3)
            // Page 2 of all 14 colors is Blood Red, Sunset Orange, Gold and Deep Sea,
            // then the filter drops Blood Red (40). 14 colors make 4 pages of 4.
            expect(names(pageFirst)).toEqual(["Sunset Orange", "Gold", "Deep Sea"])
            expect(pageFirst.body.pagination.totalPages).toBe(4)
        })

        test("prev and next keep the rest of the query string as it was written", async () => {
            const res = await request(app).get("/colors?colorType[in]=red&sort=-opacity&page=2&limit=2&select=name")

            expect(res.body.pagination.prev).toBe("/colors?colorType[in]=red&sort=-opacity&page=1&limit=2&select=name")
            expect(res.body.pagination.next).toBe("/colors?colorType[in]=red&sort=-opacity&page=3&limit=2&select=name")
        })
    })

    describe("a query string that can't run gets a 400", () => {

        test.each([
            ["opacity[gte]=abc", 'opacity[gte] must be a number (got "abc")'],
            ["opacity[between]=10", "between is not a query operator. Use one of: eq, ne, gt, gte, lt, lte, in, nin"],
            ["pallette=123", 'pallette must be a MongoDB ID (got "123")'],
            ["sort=name,-name", "sort has name in it more than once"],
            ["shade=red", '"shade" is not a field. Use one of: name, colorType, hexcode, opacity, pallette, _id'],
            ["limit=0", "limit must be a whole number from 1 to 100"],
            ["page=abc", "page must be a whole number, 1 or more"],
            ["page=1&page=2", "page is in the query string more than once"],
        ])("?%s", async (queryString, message) => {
            const res = await request(app).get(`/colors?${queryString}`)

            expect(res.status).toBe(400)
            expect(res.body.message).toBe(message)
        })
    })
})
