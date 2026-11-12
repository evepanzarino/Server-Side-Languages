# **Server-Side-Languages**

**Commits**
- Initial Commit
- Create myModule.js
- Node Modules
- HTTP Request and Response
- 1.4 - Let's Code NodeJS
- 1.7 - NodeJS Unit Testing Assignment
- Async / Await Discussion



## **Videos**
 **1.5** [![Watch on YouTube](https://img.shields.io/badge/Watch_on_YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=TA8HLuD27uc)
 
**1.7** [![Watch on YouTube](https://img.shields.io/badge/Watch_on_YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=iOBZa2rXwwk)


## Routes

### **Books Router**
/app/routes/books.js
the 5 CRUD methods for books
1. Get: GET localhost:3000/books - gets all books
2. Get by ID: GET localhost:3000/books/{bookid#} - gets book by id
3. Post: POST localhost:3000/books - Body raw JSON { "bookname": "dune", "author": "Frank Herbert" } - Post new book
4. Put by ID: PUT localhost:3000/books/{bookid#} - Edit by ID Body raw JSON
5. Delete by ID: DELETE localhost:3000/books/{bookid#} - Deletes book by id

### **Users Router**
/app/routes/index.js
the 5 CRUD methods for /app/models/users.js, which saves the users to /app/data/users.json with the fs module
1. Get: GET localhost:3000/users - gets all users
2. Get by ID: GET localhost:3000/users/{userid#} - gets user by id
3. Post: POST localhost:3000/users - Body raw JSON { "name": "Steve", "email": "steve@example.com" } - Post new user. The server gives it the next id
4. Put by ID: PUT localhost:3000/users/{userid#} - Body raw JSON { "name": "Steven", "email": "steven@example.com" } - replaces the user's name and email. name is required
5. Delete by ID: DELETE localhost:3000/users/{userid#} - deletes user by id

### **Pallettes Router (MongoDB)**
/app/routes/pallettes.js → /app/controllers/palletteController.js → /app/models/Pallettes.js
the 5 CRUD methods for the pallettes collection
1. Get: GET localhost:3000/pallettes - gets all pallettes, 10 at a time, sorted by name. It takes a query string to filter, sort, skip, limit, page and select, in any order, see [Query Strings](#query-strings-module-3)
   - Pagination: GET localhost:3000/pallettes?page=1 - the first 10. GET localhost:3000/pallettes?page=2&limit=5 - page 2, with 5 to a page, see [Pagination with page](#pagination-with-page)
2. Get by ID: GET localhost:3000/pallettes/{palletteId} - gets a pallette and the colors it has
3. Post: POST localhost:3000/pallettes - Body raw JSON { "name": "Sunset", "Description": "Warm sunset colors", "colorTypes": "red, orange", "hexcodes": ["#ff4500", "#ffa500"] } - Post new pallette. NumberofColors is counted from hexcodes, so this one gets 2.
4. Put by ID: PUT localhost:3000/pallettes/{palletteId} - Body raw JSON with the fields to change, e.g. { "hexcodes": ["#00ffff", "#008080", "#000080"] } changes NumberofColors to 3
5. Delete by ID: DELETE localhost:3000/pallettes/{palletteId} - deletes the pallette and its colors

### **Colors Router (MongoDB)**
/app/routes/colors.js → /app/controllers/colorController.js → /app/models/Colors.js
the 5 CRUD methods for colors, which MongoDB stores in the "color" collection
1. Get: GET localhost:3000/colors - gets all colors with their pallette, 10 at a time, oldest first. It takes a query string to filter, sort, skip, limit, page and select, in any order, see [Query Strings](#query-strings-module-3)
   - Pagination: GET localhost:3000/colors?page=1 - the first 10. GET localhost:3000/colors?page=2&limit=5 - page 2, with 5 to a page
2. Get by ID: GET localhost:3000/colors/{colorId} - gets a color and its pallette
3. Post: POST localhost:3000/colors - Body raw JSON { "name": "Sunset Red", "colorType": ["red", "orange"], "hexcode": "#ff4500", "opacity": 80, "pallette": "{palletteId}" } - Post new color. "pallette" is the _id of a pallette in the first collection (found in MongoDB)
4. Put by ID: PUT localhost:3000/colors/{colorId} - Body raw JSON with the fields to change, e.g. { "hexcode": "#ff6347", "opacity": 50 }
5. Delete by ID: DELETE localhost:3000/colors/{colorId} - deletes color by id

### **Geo Data Router (Open-Meteo API + MongoDB)**
/app/routes/geoData.js → /app/controllers/geoDataController.js → /app/services/geoService.js → /app/models/GeoData.js
the 4 routes for the geospatial API, see [Geo Data API](#geo-data-api-33)
1. Get live: GET localhost:3000/api/geo-data?lat=28.5383&lon=-81.3792&name=Orlando - gets the weather at that location from the Open-Meteo API. name is optional
2. Post: POST localhost:3000/api/geo-data - Body raw JSON: the "data" from a live lookup - saves it and sends back its id
3. Get all: GET localhost:3000/api/geo-data - gets the saved geo data, 10 at a time, newest first. It takes a query string too, including page: GET localhost:3000/api/geo-data?page=2
4. Get by ID: GET localhost:3000/api/geo-data/{geoDataId} - gets one saved entry


## **Query Strings (Module 3)**
GET /pallettes, GET /colors and GET /api/geo-data (without lat and lon) take a query string. /app/utils/queryPipeline.js reads it in the order it's written and turns each operation into a step. /app/services/runPipeline.js runs the steps as a MongoDB aggregation pipeline: one stage per step, in the same order.

### **Every operation runs in the order it's written**
A query string can have as many operations as you want, in any order, and each one can be used more than once. Each step works on what the step before it left.

| Operation | Example | What it does | MongoDB stage |
|---|---|---|---|
| filter | `opacity[gte]=50&opacity[lt]=100` | keeps the documents that pass every filter | `$match` |
| sort | `sort=-opacity,name` | sorts by the first field, then by the next one when there's a tie | `$sort` |
| skip | `skip=5` | drops the first 5 documents | `$skip` |
| limit | `limit=5` | keeps the first 5 documents | `$limit` |
| page | `page=2&limit=5` | page 2, with 5 to a page (10 without a limit) | `$skip` then `$limit` |
| select | `select=name,opacity` or `select=-pallette` | shows only some fields, or leaves some out | `$project` |

So the same operations in a different order can give different results:

| Request | What comes back |
|---|---|
| `GET /colors?sort=-opacity&limit=3` | the 3 most solid colors |
| `GET /colors?limit=3&sort=-opacity` | the first 3 colors, sorted most solid first |
| `GET /colors?skip=2&limit=5` | colors 3 to 7 |
| `GET /colors?limit=5&skip=2` | colors 3 to 5 (keep 5, then drop the first 2 of those) |
| `GET /colors?opacity[gte]=80&limit=3` | the first 3 colors with opacity 80 or more |
| `GET /colors?limit=3&opacity[gte]=80` | out of the first 3 colors, the ones with opacity 80 or more |

Filters written next to each other are one step, since they all have to match.

### **Steps that get added**
- **A default sort:** skip, limit and page need the list in a fixed order. If no sort comes before the first skip, limit or page, the default sort goes first: pallettes by name, colors oldest first, geo data newest first.
- **limit=10:** if there's no limit, one goes at the end, so a response has 10 documents at most.

Both show up in the response with `"default": true`. For `GET /colors?limit=3&sort=-opacity&select=name,opacity`:
```json
"query": [
    { "sort": { "_id": 1 }, "default": true },
    { "limit": 3 },
    { "sort": { "opacity": -1, "_id": 1 } },
    { "select": { "name": 1, "opacity": 1 } }
]
```

### **A step can only use fields that are still there**
`select` runs where it's written, so a later step can't use a field it left out. `GET /colors?sort=opacity&select=name` works, but `GET /colors?select=name&sort=opacity` gets a 400: `sort uses opacity, but a select before it left opacity out`.

### **Query operators**
| Operator | Example | Matches |
|---|---|---|
| eq | `name=Gold` or `name[eq]=Gold` | equal to |
| ne | `colorType[ne]=black` | not equal to |
| gt, gte | `NumberofColors[gt]=2`, `opacity[gte]=50` | greater than, greater than or equal to |
| lt, lte | `opacity[lt]=100`, `NumberofColors[lte]=5` | less than, less than or equal to |
| in | `colorType[in]=red,blue` | any of the values in the list |
| nin | `name[nin]=Sunset,Ocean` | none of the values in the list |

- Filters can use any field in the model, and every filter in a step has to match. Two filters on one field make a range: `opacity[gte]=50&opacity[lt]=100`.
- Values are changed to the field's type, so `opacity[gte]=50` compares numbers and `observedAt[gte]=2026-11-01` compares dates. Color types are lowercased, like the schema saves them.
- The same field and operator twice in one step, like `name[ne]=Red&name[ne]=Black`, runs both filters (a MongoDB `$and`, in the order written).
- Field names and operators don't care about case (`numberofcolors[GTE]=3` works), and `opacity[$gte]=50` works too.
- A `#` in a URL starts the fragment, so write hex codes with `%23`: `hexcode=%23ff4500`. The same goes for `&` in a name: `name=Shades of Black %26 White`.

### **select, sort, skip and limit**
- `select=name,opacity` shows only those fields (and `_id`). `select=-pallette,-hexcode` leaves those fields out. Add `-_id` to a list of fields to show to hide the `_id`. `__v` is always left out.
- On /colors, a color's pallette is populated when the select kept it.
- `sort=opacity` goes low to high and `sort=-opacity` goes high to low. `_id` is added to every sort, so equal values always come out in the same order.
- `skip` is 0 or more, and `limit` is 1 to 100. `skip=0&limit=5` is the first 5, and `skip=5&limit=5` is the next 5. `page` does the same thing in page numbers.

### **Pagination with page**
`page` is 1 or more. `limit` is the page size (10 when there's no limit), so `page=2&limit=5` skips the first 5 and keeps the next 5.
- `page` runs where it's written, like the other steps. Filters and sorts before it decide what gets split into pages. `limit` can go before or after `page`, it's still the page size.
- With `page`, `skip` can't be used, since page does the skipping. `page` and `limit` can each be in the query string once.
- A page past the end comes back empty, with `prev` linking to the last page.

The response gets a `pagination` part. `totalPages` is how many pages the documents make, and `prev` and `next` are the same URL with the page number changed (`null` when there isn't one). With the test data in /app/tests/fixtures.js:

`GET localhost:3000/pallettes?page=2&limit=2&select=name`
```json
{
    "message": "Get all pallettes",
    "query": [
        { "sort": { "name": 1, "_id": 1 }, "default": true },
        { "page": 2, "limit": 2 },
        { "select": { "name": 1 } }
    ],
    "count": 2,
    "total": 6,
    "pagination": {
        "page": 2,
        "limit": 2,
        "totalPages": 3,
        "prev": "/pallettes?page=1&limit=2&select=name",
        "next": "/pallettes?page=3&limit=2&select=name"
    },
    "data": [
        { "_id": "a00000000000000000000003", "name": "Ocean" },
        { "_id": "a00000000000000000000006", "name": "Pastels" }
    ],
    "metadata": { "hostname": "localhost", "method": "GET" }
}
```

### **Response**
Every getAll response lists the steps it ran in `query`, in order. `count` is how many documents came back, and `total` is how many match the filters, without skip and limit. With the test data in /app/tests/fixtures.js:

`GET localhost:3000/colors?select=name,opacity&opacity[gte]=50&sort=-opacity,name&skip=2&limit=3`
```json
{
    "message": "Get all colors",
    "query": [
        { "select": { "name": 1, "opacity": 1 } },
        { "filter": { "opacity": { "$gte": 50 } } },
        { "sort": { "opacity": -1, "name": 1, "_id": 1 } },
        { "skip": 2 },
        { "limit": 3 }
    ],
    "count": 3,
    "total": 11,
    "data": [
        { "_id": "c00000000000000000000001", "name": "Red", "opacity": 100 },
        { "_id": "c00000000000000000000002", "name": "Bright Red", "opacity": 90 },
        { "_id": "c00000000000000000000011", "name": "Bark", "opacity": 85 }
    ],
    "metadata": { "hostname": "localhost", "method": "GET" }
}
```
11 colors have opacity 50 or more. Sorted most solid first they start Black, Deep Sea, Red, Bright Red, Bark, so skipping 2 and keeping 3 leaves Red, Bright Red and Bark.

### **Examples**
| Request | What comes back |
|---|---|
| `GET /pallettes?NumberofColors[gte]=3&NumberofColors[lte]=5&select=name,NumberofColors` | pallettes with 3 to 5 colors, with only their name and NumberofColors |
| `GET /pallettes?name[nin]=Sunset,Ocean&select=-hexcodes,-Description` | every pallette but Sunset and Ocean, without hexcodes and Description |
| `GET /pallettes?sort=-NumberofColors&skip=2&limit=2` | the 3rd and 4th pallettes with the most colors |
| `GET /colors?colorType[in]=blue,green&select=-pallette,-hexcode` | colors with blue or green, without their pallette and hexcode |
| `GET /colors?pallette={palletteId}&sort=-opacity&skip=1&opacity[gt]=20&limit=2&select=name,opacity,pallette` | every operation, in a mixed-up order |

### **Errors**
A query string that can't run gets a 400 with a message that says why. For example `opacity[gte]=abc` gets `opacity[gte] must be a number (got "abc")`. The same goes for a field or operator that doesn't exist, a step that uses a field an earlier select left out, a select that shows some fields and leaves others out, a field in one sort twice, a limit over 100, a page under 1, or `page` with `skip`.


## **Geo Data API (3.3)**
Gets the weather at a location from a public geospatial API, saves it in MongoDB, and lists the saved data with the same query strings as the other getAll routes.

### **API used: Open-Meteo**
- Docs: https://open-meteo.com/en/docs
- Endpoint: `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
- **No API key is needed.** It's free for non-commercial use.
- /app/services/geoService.js calls it with `fetch`, and /app/config/geoApi.js has its settings.

### **Setup and run**
1. Do the MongoDB setup below (`npm install`, start MongoDB, `.env`).
2. `npm run dev`
3. Send `GET localhost:3000/api/geo-data?lat=28.5383&lon=-81.3792&name=Orlando`, then POST the `data` it sends back to `localhost:3000/api/geo-data`.

These settings are optional. Add them to `.env` to change them:

| Variable | Default | What it does |
|---|---|---|
| GEO_API_URL | https://api.open-meteo.com/v1/forecast | the API endpoint |
| GEO_API_TIMEOUT_MS | 5000 | how long to wait for the API |
| GEO_API_RATE_LIMIT | 10 | how many calls to the API are allowed in each window |
| GEO_API_RATE_WINDOW_MS | 60000 | the rate limit window (1 minute) |

### **Routes**
| Route | What it does |
|---|---|
| GET /api/geo-data?lat=28.5383&lon=-81.3792&name=Orlando | a. calls the Open-Meteo API and sends back the weather at that location. name is optional. The `data` is ready to POST |
| POST /api/geo-data | b. saves the geo data in the body and sends back "Geo data saved" with its `id`. latitude and longitude are required |
| GET /api/geo-data | c. the saved geo data, newest first, 10 at a time. It takes the same query strings as the other getAll routes |
| GET /api/geo-data/:id | d. one saved entry |

GET /api/geo-data is the URL for both a. and c., so lat and lon pick the live lookup. Without them it lists the saved data.

Filtering the saved data:
- By date range: `GET /api/geo-data?observedAt[gte]=2026-11-01&observedAt[lt]=2026-11-16`
- By location, with a box of latitudes and longitudes: `GET /api/geo-data?latitude[gte]=27&latitude[lte]=29&longitude[gte]=-83&longitude[lte]=-80`
- Both, the 5 warmest: `GET /api/geo-data?observedAt[gte]=2026-11-01&latitude[gte]=27&latitude[lte]=29&sort=-temperature&limit=5&select=name,temperature,observedAt`. Add `skip=5` before `limit` for the next 5.

### **Model: GeoData**
| Field | Type | Validation |
|---|---|---|
| name | String | optional, up to 100 characters |
| latitude | Number | required, -90 to 90 |
| longitude | Number | required, -180 to 180 |
| elevation | Number | meters above sea level |
| timezone | String | like America/New_York |
| temperature | Number | °C |
| humidity | Number | 0 to 100 % |
| windSpeed | Number | km/h, 0 or more |
| weatherCode | Number | the WMO weather code, 0 to 99 |
| conditions | String | the weather code in words, like Overcast |
| observedAt | Date | when the weather was measured, now if it isn't sent |
| createdAt, updatedAt | Date | added by timestamps |

### **Rate limiting (bonus)**
Live lookups can make 10 calls to the Open-Meteo API a minute (/app/utils/rateLimiter.js). After that, a live lookup gets a 429 with a `Retry-After` header that says how many seconds to wait. Only calls that would reach the API count, so a bad lat or lon doesn't use one up, and listing the saved data isn't limited.

### **Error handling**
- 400 - a missing or out of range lat or lon, a live lookup with other keys in the query string, a query string that can't run, a POST body that breaks a schema rule, or an ID that isn't a MongoDB ID
- 404 - no geo data has that ID
- 429 - too many calls to the API (see Rate limiting)
- 502 - the API sent back an error or data the app can't read, or it couldn't be reached
- 504 - the API didn't answer within 5 seconds


## **Jest Tests (3.6)**
The tests use Jest and Supertest to call the API, so each test checks the route, the query string and the response together.

| Command | Services |
|---|---|
| `npm test` | **mocked**: /app/services/\_\_mocks\_\_ runs the same queries on the test data in /app/tests/fixtures.js, so MongoDB and the internet aren't needed |
| `npm run test:real` | **not mocked**: each test file fills its own MongoDB test database (named color-pallettes-test-...) with the same test data and deletes it at the end, and the live lookups call the real Open-Meteo API. MongoDB has to be running |

Both commands run the same tests, and they all pass both ways.

| File | What it tests |
|---|---|
| /app/tests/pallettes.query.test.js | GET /pallettes: query operators with select (limited data), skip and limit, sort in both directions, pagination with page, the same steps in different orders, and 400s |
| /app/tests/colors.query.test.js | the same for GET /colors, plus populate with select |
| /app/tests/queryPipeline.test.js | how a query string turns into steps, in the order they're written |
| /app/tests/geoData.test.js | the 4 geo data routes, and the Open-Meteo call with fetch mocked |
| /app/tests/geoRateLimit.test.js | the rate limit on the Open-Meteo calls |
| /app/tests/users.test.js, math.test.js, string.test.js | module 1 |


## **MongoDB**

### **Setup**
1. `npm install` installs the dependencies.
2. Start MongoDB locally (`brew services start mongodb-community`).
3. Add the connection string to `.env` (if it's missing, the app uses this same local address):
   `MONGODB_URI=mongodb://127.0.0.1:27017/color-pallettes`
4. `npm run seed` adds the 7 pallettes in /app/data/pallettes.json and their 105 colors in /app/data/colors.json (15 each). It splits each pallette's hexcodes into a list, counts NumberofColors, and gives each color its pallette's `_id`. A pallette that's already in the database is skipped with its colors, so it's safe to run again.
5. `npm run dev`. The server connects to MongoDB before it starts listening.
6. `npm test` runs the Jest tests with the mocked services, and `npm run test:real` runs them without the mocks (see [Jest Tests](#jest-tests-36)).

### **Models: a Color has a Pallette**
Each color stores its pallette's `_id` in `pallette` (`ref: 'Pallette'`). `.populate('pallette')` loads the pallette for a color, and the pallette's virtual `color` field lists a pallette's colors.

| Pallette | Type | Validation |
|---|---|---|
| name | String | required, 2-30 characters, unique |
| Description | String | required, up to 255 characters |
| colorTypes | String | required, 2-999 characters |
| hexcodes | Array of Strings | at least one 6-digit hex code, each with or without the # |
| NumberofColors | Number | counted from hexcodes (one hex code sent as a string counts as 1), up to 999; not read from the body |

| Color | Type | Validation |
|---|---|---|
| name | String | required, up to 20 characters |
| colorType | Array of Strings | 1 or 2 different color types |
| hexcode | String | 6 hex digits with or without the #, default #000000 |
| opacity | Number | 0-100, where 0 is fully transparent and 100 is fully opaque, default 100 |
| pallette | ObjectId (ref Pallette) | required, the pallette must exist |

The color types are red, orange, yellow, green, blue, purple, black, white, brown and beige. They can be sent in any case and are saved in lowercase.

Each model has 5 properties, and together they use 4 data types: String, Number, Array and ObjectId.

### **Select and populate**
- `.select('-__v')` leaves Mongoose's version key out of every payload. `create()` can't use it, so the POST functions read the new document back with `findById()`.
- `.populate('pallette', '-__v')` shows the full pallette from the first collection in the payload of all 5 color functions.
- `.populate('color', '-__v')` lists a pallette's colors in GET pallette by ID.
- GET all also takes `select` from the query string, see [Query Strings](#query-strings-module-3). It still leaves `__v` out.

### **Checking the database first**
Every `:id` function checks the object is in the database before doing anything with it, and answers with "Pallette {id} not found" or "Color {id} not found" if it isn't. GET by ID checks the result of `findById()`, and PUT and DELETE call `exists()` first, so an unknown ID gets a 404 even when a PUT body has bad values.

### **Messages module**
/app/messages/messages.js holds every message the pallettes and colors code sends back, including the validation messages in the models. The controllers, models, middleware and /app/index.js all read from it. Messages that include a value, like an ID, are functions.

### **Error handling**
- 400 - an ID in the URL that isn't a MongoDB ID (/app/middleware/validateId.js)
- 400 - a GET all query string that can't run, like `opacity[gte]=abc` (/app/utils/queryPipeline.js)
- 400 - a body that breaks a schema rule; `errors` lists the message for each field
- 400 - a body that isn't valid JSON
- 400 or 413 - another request the server can't process, such as a URL it can't read or a body that is too large
- 404 - no pallette or color has that ID, or the URL isn't a route
- 409 - the pallette name is already taken
- 500 - any other server or database error

### **Postman**
Run the /Colors and Pallettes API collection from top to bottom. It covers all 10 CRUD requests and the error responses, with tests on each request.


## **Postman Tests**
The collections are saved in Postman's local file format. Each one is a folder in this project, listed in /.postman/resources.yaml (the first 3 also have synced copies in /postman/collections). Open this project as a local workspace in Postman, or run a collection with the Postman CLI, like `postman collection run "Query Operators API Tests"`. Start the server with `npm run dev` first.

| Collection | Requests | What it tests |
|---|---|---|
| /Pallettes API Tests | 14 | integration tests for the pallettes collection (table below) |
| /Colors and Pallettes API | 33 | all 10 CRUD requests for pallettes and colors, and their error responses |
| /Users API | 6 | the users routes (fs module) |
| /Query Operators API Tests | 41 | module 3: query operators with select, sort in both directions, skip and limit, pagination with page, the same steps in different orders, and 400s. It makes its own pallettes and colors and deletes them at the end |
| /Geo Data API | 10 | 3.3: the live lookup, POST, GET all with date and location filters, GET by ID, and errors |

GET all is paged now, so the GET all requests in the first 2 collections use `sort=-_id` (newest first) to keep the pallette or color they made on page 1.

/Pallettes API Tests has the integration tests for the pallettes collection, my first MongoDB collection. The tests check status codes and returned payloads, including error responses and whether changes were really saved to the database.

| Folder | Requests | Tests | What the tests check |
|---|---|---|---|
| POST | 3 | 12 | 201 with the data sent, a generated `_id`, no `__v` in the payload, 400 for missing fields, 409 for a taken name |
| GET | 1 | 5 | 200, the list includes the new pallette, every pallette has all of its fields |
| GET by ID | 3 | 12 | 200 with the right pallette and an empty `color` list, 404 for an unknown ID, 400 for an invalid ID |
| PUT by ID | 4 | 15 | 200 with the new values, other fields unchanged, 400 for bad values, 404 for an unknown ID, a follow-up GET confirms only the valid update was saved |
| DELETE by ID | 3 | 10 | 200 with the deleted pallette, a follow-up GET returns 404, deleting again returns 404 |

**To run the tests:**
1. Make sure MongoDB is running, then start the server with `npm run dev`.
2. Open /Pallettes API Tests in Postman.
3. Run the whole collection from top to bottom with the Collection Runner. The requests after POST use the pallette it creates, and the DELETE folder removes that pallette, so the collection can be run again.


## **EndPoints**
All route endpoints (localhost:3000)

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/` | service is running |
| **Users (fs)** | | |
| GET | `/users` | all users |
| GET | `/users/:id` | one user |
| POST | `/users` | create a user |
| PUT | `/users/:id` | update a user |
| DELETE | `/users/:id` | delete a user |
| **Books (in memory)** | | |
| GET | `/books` | all books |
| GET | `/books/:bookId` | one book |
| POST | `/books` | create a book |
| PUT | `/books/:bookId` | update a book |
| DELETE | `/books/:bookId` | delete a book |
| **Pallettes (MongoDB)** | | |
| GET | `/pallettes` | all pallettes (filter, sort, skip, limit, select) |
| GET | `/pallettes?page=1` | page 1 (10 per page) |
| GET | `/pallettes?page=2&limit=5` | page 2, 5 per page |
| GET | `/pallettes/:id` | one pallette, with its colors |
| POST | `/pallettes` | create a pallette |
| PUT | `/pallettes/:id` | update a pallette |
| DELETE | `/pallettes/:id` | delete a pallette and its colors |
| **Colors (MongoDB)** | | |
| GET | `/colors` | all colors, with their pallette (same query string) |
| GET | `/colors?page=1` | page 1 |
| GET | `/colors?page=2&limit=5` | page 2, 5 per page |
| GET | `/colors/:id` | one color, with its pallette |
| POST | `/colors` | create a color |
| PUT | `/colors/:id` | update a color |
| DELETE | `/colors/:id` | delete a color |
| **Geo Data (Open-Meteo + MongoDB)** | | |
| GET | `/api/geo-data?lat=28.5383&lon=-81.3792` | live weather from Open-Meteo |
| GET | `/api/geo-data` | saved geo data (same query string) |
| GET | `/api/geo-data?page=2` | page 2 of saved geo data |
| POST | `/api/geo-data` | save geo data |
| GET | `/api/geo-data/:id` | one saved entry |

## **Directory**

### **Root**
- /promiseChain.js
- /myModule.js
- /pokemon.js
- /colors.js
### **Jest Tests**
- /app/tests/math.js
- /app/tests/math.test.js
- /app/tests/string.js
- /app/tests/string.test.js
- /app/tests/users.test.js
- /app/tests/queryPipeline.test.js
- /app/tests/pallettes.query.test.js
- /app/tests/colors.query.test.js
- /app/tests/geoData.test.js
- /app/tests/geoRateLimit.test.js
- /app/tests/fixtures.js (the test data)
- /app/tests/helpers/runInMemory.js (runs the steps for the mocked services)
- /app/tests/helpers/testDatabase.js (mocked or real, and the test databases)
### **Models**
- /app/models/users.js
- /app/models/Pallettes.js
- /app/models/Colors.js
- /app/models/GeoData.js
### **Controllers**
- /app/controllers/palletteController.js
- /app/controllers/colorController.js
- /app/controllers/geoDataController.js
- /app/controllers/responses.js
### **Services**
- /app/services/runPipeline.js
- /app/services/palletteService.js
- /app/services/colorService.js
- /app/services/geoService.js
- /app/services/\_\_mocks\_\_/ (the mocked palletteService.js, colorService.js and geoService.js)
### **Utils**
- /app/utils/queryPipeline.js
- /app/utils/rateLimiter.js
- /app/utils/httpError.js
### **Middleware**
- /app/middleware/validateId.js
### **Messages**
- /app/messages/messages.js
### **Config**
- /app/config/db.js (the MongoDB connection)
- /app/config/geoApi.js (the Open-Meteo API settings)
### **Data**
- /app/data/users.json
- /app/data/pallettes.json and /app/data/colors.json (the seed data)
- /app/data/seed.js (`npm run seed`)
### **Routes**
- /app/routes/books.js
- /app/routes/index.js
- /app/routes/pallettes.js
- /app/routes/colors.js
- /app/routes/geoData.js
### **Postman Collections**
- /Users API
- /Colors and Pallettes API
- /Pallettes API Tests
- /Query Operators API Tests
- /Geo Data API
- /postman/collections (synced copies)
- /.postman/resources.yaml
### **Node Modules**
- /node_modules
### **Environment Files**
- /server.js
- /app/index.js
- /.env (local only, never committed)
- /.gitignore
- /package.json
- /package-lock.json
### **Documentation**
- /README.md **(That's me!)**
