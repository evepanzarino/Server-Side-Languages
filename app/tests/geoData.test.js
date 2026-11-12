// Jest + Supertest tests for the geospatial API routes (3.3).
// npm test uses the mocked geo service. npm run test:real runs the same tests
// without the mock: the live lookups call the real Open-Meteo API, and the saved
// geo data comes from a MongoDB test database with the same data.
const { useMocks, startDatabase, stopDatabase } = require("./helpers/testDatabase")
if (useMocks) {
    jest.mock("../services/geoService")
}

const request = require("supertest")
const app = require("../index")

beforeAll(() => startDatabase("geo"))
afterAll(() => stopDatabase())

// The names in a response, in order.
const names = (res) => res.body.data.map((entry) => entry.name)

describe("GET /api/geo-data with lat and lon (live lookup)", () => {

    test("returns the weather at that location, ready to save", async () => {
        const res = await request(app).get("/api/geo-data?lat=28.5383&lon=-81.3792&name=Full%20Sail")

        expect(res.status).toBe(200)
        expect(res.body.message).toBe("Live geo data from the Open-Meteo API")
        const { data } = res.body
        expect(data).toMatchObject({ name: "Full Sail", latitude: 28.5383, longitude: -81.3792 })
        expect(typeof data.temperature).toBe("number")
        expect(typeof data.elevation).toBe("number")
        expect(typeof data.timezone).toBe("string")
        expect(typeof data.conditions).toBe("string")
        expect(Number.isInteger(data.weatherCode)).toBe(true)
        expect(data.humidity).toBeGreaterThanOrEqual(0)
        expect(data.humidity).toBeLessThanOrEqual(100)
        expect(data.windSpeed).toBeGreaterThanOrEqual(0)
        expect(Number.isNaN(Date.parse(data.observedAt))).toBe(false)
    })

    test.each([
        ["lat=28.5383", "A live lookup needs both lat and lon, like ?lat=28.5383&lon=-81.3792"],
        ["lat=95&lon=10", 'lat must be a number from -90 to 90 (got "95")'],
        ["lat=28&lon=east", 'lon must be a number from -180 to 180 (got "east")'],
        ["lat=28&lon=-81&sort=name", "A live lookup only takes lat, lon and name (also got sort)"],
    ])("?%s gets a 400", async (queryString, message) => {
        const res = await request(app).get(`/api/geo-data?${queryString}`)

        expect(res.status).toBe(400)
        expect(res.body.message).toBe(message)
    })
})

describe("GET /api/geo-data without lat and lon (saved geo data)", () => {

    test("no sort is newest first", async () => {
        const res = await request(app).get("/api/geo-data?observedAt[lt]=2026-11-01&select=name")

        expect(res.status).toBe(200)
        expect(res.body.message).toBe("Get all geo data")
        expect(names(res)).toEqual(["Anchorage", "Denver", "New York", "Tampa", "Miami", "Orlando"])
    })

    test("filters by a date range", async () => {
        const res = await request(app).get("/api/geo-data?observedAt[gte]=2026-10-10&observedAt[lte]=2026-10-25&sort=observedAt&select=name,observedAt")

        expect(res.status).toBe(200)
        expect(names(res)).toEqual(["Miami", "Tampa", "New York"])
        res.body.data.forEach((entry) => {
            expect(Object.keys(entry).sort()).toEqual(["_id", "name", "observedAt"])
        })
    })

    test("filters by location, with a box of latitudes and longitudes", async () => {
        const res = await request(app).get("/api/geo-data?latitude[gte]=25&latitude[lte]=29&longitude[gte]=-83&longitude[lte]=-80&sort=-latitude&select=name,latitude,longitude")

        expect(res.status).toBe(200)
        expect(names(res)).toEqual(["Orlando", "Tampa", "Miami"])
    })

    test("sorts, skips and limits: the 3rd and 4th warmest", async () => {
        const res = await request(app).get("/api/geo-data?observedAt[lt]=2026-11-01&sort=-temperature&skip=2&limit=2&select=name,temperature")

        expect(res.status).toBe(200)
        expect(res.body.data).toEqual([
            { _id: "e00000000000000000000003", name: "Tampa", temperature: 26.3 },
            { _id: "e00000000000000000000004", name: "New York", temperature: 14.2 },
        ])
        expect(res.body.count).toBe(2)
        expect(res.body.total).toBe(6)
    })

    test("the steps run in the order they're written: limit first, then sort", async () => {
        const res = await request(app).get("/api/geo-data?observedAt[lt]=2026-11-01&limit=3&sort=temperature&select=name,temperature")

        // The 3 newest are Anchorage, Denver and New York. Then they're sorted coldest first.
        expect(res.status).toBe(200)
        expect(res.body.data.map((entry) => entry.name)).toEqual(["Anchorage", "Denver", "New York"])
        expect(res.body.data.map((entry) => entry.temperature)).toEqual([-3.5, 9.8, 14.2])
    })
})

describe("POST /api/geo-data", () => {

    const reading = {
        name: "Full Sail",
        latitude: 28.5383,
        longitude: -81.3792,
        elevation: 35,
        timezone: "America/New_York",
        temperature: 26.6,
        humidity: 43,
        windSpeed: 10.5,
        weatherCode: 3,
        conditions: "Overcast",
        observedAt: "2026-11-12T17:00:00.000Z",
    }

    test("saves the geo data and returns its new ID", async () => {
        const res = await request(app).post("/api/geo-data").send(reading)

        expect(res.status).toBe(201)
        expect(res.body.message).toBe("Geo data saved")
        expect(res.body.id).toMatch(/^[0-9a-f]{24}$/)
        expect(res.body.data).toMatchObject(reading)
        expect(res.body.data).not.toHaveProperty("__v")

        // GET by ID finds it.
        const saved = await request(app).get(`/api/geo-data/${res.body.id}`)
        expect(saved.status).toBe(200)
        expect(saved.body.data).toMatchObject(reading)
    })

    test("the data from a live lookup can be saved as it is", async () => {
        const live = await request(app).get("/api/geo-data?lat=40.7128&lon=-74.006&name=New%20York")
        const res = await request(app).post("/api/geo-data").send(live.body.data)

        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject(live.body.data)
    })

    test("a body without latitude and longitude gets a 400 for each", async () => {
        const res = await request(app).post("/api/geo-data").send({ name: "Nowhere", humidity: 120 })

        expect(res.status).toBe(400)
        expect(res.body.errors).toEqual({
            latitude: "latitude is required",
            longitude: "longitude is required",
            humidity: "humidity must be from 0 to 100",
        })
    })
})

describe("GET /api/geo-data/:id", () => {

    test("returns one saved entry", async () => {
        const res = await request(app).get("/api/geo-data/e00000000000000000000003")

        expect(res.status).toBe(200)
        expect(res.body.message).toBe("Get geo data by ID")
        expect(res.body.data).toMatchObject({ name: "Tampa", latitude: 27.9506, longitude: -82.4572 })
    })

    test("an ID that isn't saved gets a 404", async () => {
        const res = await request(app).get("/api/geo-data/e00000000000000000000099")

        expect(res.status).toBe(404)
        expect(res.body.message).toBe("Geo data e00000000000000000000099 not found")
    })

    test("an ID that isn't a MongoDB ID gets a 400", async () => {
        const res = await request(app).get("/api/geo-data/tampa")

        expect(res.status).toBe(400)
        expect(res.body.message).toBe("tampa is not a valid ID")
    })
})

describe("the Open-Meteo call in geoService.js, with fetch mocked", () => {
    // Always the real service with a pretend fetch, so these pass with or without the mocks.
    const { fetchConditions } = jest.requireActual("../services/geoService")

    afterEach(() => jest.restoreAllMocks())

    const fakeResponse = (status, body) => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    })

    test("asks for the current weather at the location and keeps the parts the app saves", async () => {
        const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(fakeResponse(200, {
            latitude: 28.55,
            longitude: -81.38,
            elevation: 35,
            timezone: "America/New_York",
            current: { time: 1794502800, temperature_2m: 26.6, relative_humidity_2m: 43, wind_speed_10m: 10.5, weather_code: 3 },
        }))

        await expect(fetchConditions(28.5383, -81.3792)).resolves.toEqual({
            latitude: 28.5383,
            longitude: -81.3792,
            elevation: 35,
            timezone: "America/New_York",
            temperature: 26.6,
            humidity: 43,
            windSpeed: 10.5,
            weatherCode: 3,
            conditions: "Overcast",
            observedAt: "2026-11-12T17:00:00.000Z",
        })

        const url = new URL(fetchSpy.mock.calls[0][0])
        expect(`${url.origin}${url.pathname}`).toBe("https://api.open-meteo.com/v1/forecast")
        expect(url.searchParams.get("latitude")).toBe("28.5383")
        expect(url.searchParams.get("longitude")).toBe("-81.3792")
    })

    test("an error from the API becomes a 502 with the API's reason", async () => {
        jest.spyOn(global, "fetch").mockResolvedValue(fakeResponse(400, { error: true, reason: "Latitude must be in range of -90 to 90°. Given: 95.0." }))

        await expect(fetchConditions(95, 0)).rejects.toMatchObject({
            status: 502,
            message: "The geospatial API answered with an error (400): Latitude must be in range of -90 to 90°. Given: 95.0.",
        })
    })

    test("an API that can't be reached becomes a 502", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("fetch failed"))

        await expect(fetchConditions(28.5, -81.4)).rejects.toMatchObject({ status: 502, message: "Could not reach the geospatial API" })
    })

    test("an API that takes too long becomes a 504", async () => {
        jest.spyOn(global, "fetch").mockRejectedValue(new DOMException("The operation was aborted due to timeout", "TimeoutError"))

        await expect(fetchConditions(28.5, -81.4)).rejects.toMatchObject({ status: 504, message: "The geospatial API did not answer within 5 seconds" })
    })
})
