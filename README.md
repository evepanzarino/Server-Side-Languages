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
1. Get: GET localhost:3000/pallettes - gets all pallettes
2. Get by ID: GET localhost:3000/pallettes/{palletteId} - gets a pallette and the colors it has
3. Post: POST localhost:3000/pallettes - Body raw JSON { "name": "Sunset", "Description": "Warm sunset colors", "colorTypes": "red, orange", "hexcodes": "#ff4500, #ffa500", "NumberofColors": 2 } - Post new pallette
4. Put by ID: PUT localhost:3000/pallettes/{palletteId} - Body raw JSON with the fields to change, e.g. { "NumberofColors": 3 }
5. Delete by ID: DELETE localhost:3000/pallettes/{palletteId} - deletes the pallette and its colors

### **Colors Router (MongoDB)**
/app/routes/colors.js → /app/controllers/colorController.js → /app/models/Colors.js
the 5 CRUD methods for colors, which MongoDB stores in the "color" collection
1. Get: GET localhost:3000/colors - gets all colors with their pallette
2. Get by ID: GET localhost:3000/colors/{colorId} - gets a color and its pallette
3. Post: POST localhost:3000/colors - Body raw JSON { "name": "Sunset Red", "primaryColorType": ["red", "orange"], "hexcode": "#ff4500", "opacity": 80, "pallette": "{palletteId}" } - Post new color. "pallette" is the _id of a pallette in the first collection (found in MongoDB)
4. Put by ID: PUT localhost:3000/colors/{colorId} - Body raw JSON with the fields to change, e.g. { "hexcode": "#ff6347", "opacity": 50 }
5. Delete by ID: DELETE localhost:3000/colors/{colorId} - deletes color by id


## **MongoDB**

### **Setup**
1. `npm install` installs the dependencies.
2. Start MongoDB locally (`brew services start mongodb-community`).
3. Add the connection string to `.env` (if it's missing, the app uses this same local address):
   `MONGODB_URI=mongodb://127.0.0.1:27017/color-pallettes`
4. `npm run dev`. The server connects to MongoDB before it starts listening.
5. `npm test` runs the Jest unit tests.

### **Models: a Color has a Pallette**
Each color stores its pallette's `_id` in `pallette` (`ref: 'Pallette'`). `.populate('pallette')` loads the pallette for a color, and the pallette's virtual `color` field lists a pallette's colors.

| Pallette | Type | Validation |
|---|---|---|
| name | String | required, 2-30 characters, unique |
| Description | String | required, up to 40 characters |
| colorTypes | String | required, 2-999 characters |
| hexcodes | String | required, 6-digit hex codes separated by commas |
| NumberofColors | Number | whole number 0-999, default 0 |

| Color | Type | Validation |
|---|---|---|
| name | String | required, up to 20 characters |
| primaryColorType | Array of Strings | 1 or 2 different color types |
| hexcode | String | 6 hex digits with or without the #, default #000000 |
| opacity | Number | 0-100, where 0 is fully transparent and 100 is fully opaque, default 100 |
| pallette | ObjectId (ref Pallette) | required, the pallette must exist |

The color types are red, orange, yellow, green, blue, purple, black, white, brown and beige. They can be sent in any case and are saved in lowercase.

Each model has 5 properties, and together they use 4 data types: String, Number, Array and ObjectId.

### **Select and populate**
- `.select('-__v')` leaves Mongoose's version key out of every payload. `create()` can't use it, so the POST functions read the new document back with `findById()`.
- `.populate('pallette', '-__v')` shows the full pallette from the first collection in the payload of all 5 color functions.
- `.populate('color', '-__v')` lists a pallette's colors in GET pallette by ID.

### **Checking the database first**
Every `:id` function checks the object is in the database before doing anything with it, and answers with "Pallette {id} not found" or "Color {id} not found" if it isn't. GET by ID checks the result of `findById()`, and PUT and DELETE call `exists()` first, so an unknown ID gets a 404 even when a PUT body has bad values.

### **Messages module**
/app/messages/messages.js holds every message the pallettes and colors code sends back, including the validation messages in the models. The controllers, models, middleware and /app/index.js all read from it. Messages that include a value, like an ID, are functions.

### **Error handling**
- 400 - an ID in the URL that isn't a MongoDB ID (/app/middleware/validateId.js)
- 400 - a body that breaks a schema rule; `errors` lists the message for each field
- 400 - a body that isn't valid JSON
- 400 or 413 - another request the server can't process, such as a URL it can't read or a body that is too large
- 404 - no pallette or color has that ID, or the URL isn't a route
- 409 - the pallette name is already taken
- 500 - any other server or database error

### **Postman**
Import /colors-pallettes.postman_collection.json into Postman and run it from top to bottom. It covers all 10 CRUD requests and the error responses, with tests on each request.


## **Postman Tests**
/pallettes.postman_collection.json has the integration tests for the pallettes collection, my first MongoDB collection. The tests check status codes and returned payloads, including error responses and whether changes were really saved to the database.

| Folder | Requests | Tests | What the tests check |
|---|---|---|---|
| POST | 3 | 12 | 201 with the data sent, a generated `_id`, no `__v` in the payload, 400 for missing fields, 409 for a taken name |
| GET | 1 | 5 | 200, the list includes the new pallette, every pallette has all of its fields |
| GET by ID | 3 | 12 | 200 with the right pallette and an empty `color` list, 404 for an unknown ID, 400 for an invalid ID |
| PUT by ID | 4 | 15 | 200 with the new values, other fields unchanged, 400 for bad values, 404 for an unknown ID, a follow-up GET confirms only the valid update was saved |
| DELETE by ID | 3 | 10 | 200 with the deleted pallette, a follow-up GET returns 404, deleting again returns 404 |

**To run the tests:**
1. Make sure MongoDB is running, then start the server with `npm run dev`.
2. Import /pallettes.postman_collection.json into Postman.
3. Run the whole collection from top to bottom with the Collection Runner. The requests after POST use the pallette it creates, and the DELETE folder removes that pallette, so the collection can be run again.


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
### **Models**
- /app/models/users.js
- /app/models/Pallettes.js
- /app/models/Colors.js
### **Controllers**
- /app/controllers/palletteController.js
- /app/controllers/colorController.js
- /app/controllers/responses.js
### **Middleware**
- /app/middleware/validateId.js
### **Messages**
- /app/messages/messages.js
### **Database**
- /app/db/config.js
### **Data**
- /app/data/users.json
### **Routes**
- /app/routes/books.js
- /app/routes/index.js
- /app/routes/pallettes.js
- /app/routes/colors.js
### **Postman Collections**
- /users.postman_collection.json
- /colors-pallettes.postman_collection.json
- /pallettes.postman_collection.json
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
