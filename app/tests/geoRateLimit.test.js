// Jest + Supertest tests for the rate limit on the Open-Meteo API calls (3.3 bonus).
// This file only allows 2 calls, so the 3rd live lookup gets a 429.
// It has its own file so the limit starts from 0.
process.env.GEO_API_RATE_LIMIT = "2"

const { useMocks, startDatabase, stopDatabase } = require("./helpers/testDatabase")
if (useMocks) {
    jest.mock("../services/geoService")
}

const request = require("supertest")
const app = require("../index")
const createRateLimiter = require("../utils/rateLimiter")

beforeAll(() => startDatabase("ratelimit"))
afterAll(async () => {
    delete process.env.GEO_API_RATE_LIMIT
    await stopDatabase()
})

describe("rate limiting the calls to the Open-Meteo API", () => {

    test("the 3rd live lookup gets a 429 with Retry-After", async () => {
        const lookup = () => request(app).get("/api/geo-data?lat=28.5383&lon=-81.3792")

        expect((await lookup()).status).toBe(200)
        expect((await lookup()).status).toBe(200)

        const res = await lookup()
        expect(res.status).toBe(429)
        const wait = Number(res.headers["retry-after"])
        expect(wait).toBeGreaterThanOrEqual(1)
        expect(wait).toBeLessThanOrEqual(60)
        expect(res.body.message).toMatch(/^Too many calls to the geospatial API\. Try again in \d+ seconds?$/)
    })

    test("a bad lat or lon still gets a 400, since it never reaches the API", async () => {
        const res = await request(app).get("/api/geo-data?lat=95&lon=0")

        expect(res.status).toBe(400)
    })

    test("listing the saved geo data isn't limited", async () => {
        const res = await request(app).get("/api/geo-data?limit=1")

        expect(res.status).toBe(200)
    })

    test("calls are let through again once the window has passed", () => {
        jest.useFakeTimers()
        const limiter = createRateLimiter({ limit: 2, windowMs: 1000 })

        expect(limiter.take()).toBe(0)
        expect(limiter.take()).toBe(0)
        // 0 means go. Anything else is how many seconds to wait.
        expect(limiter.take()).toBe(1)

        jest.advanceTimersByTime(1000)
        expect(limiter.take()).toBe(0)
        jest.useRealTimers()
    })
})
