// Books router: the 5 CRUD methods for the "books" resource.
// app/index.js mounts this router at /books, so "/" below means
// localhost:3000/books and "/:bookId" means localhost:3000/books/:bookId.
const express = require('express');
const router = express.Router();

// In-memory data store. Changes are kept while the server runs,
// and the list resets to these six books whenever the server restarts.
const books = [
    { bookId: 1, bookname: "fault in our stars", author: "John Green" },
    { bookId: 2, bookname: "looking for alaska", author: "John Green" },
    { bookId: 3, bookname: "paper towns", author: "John Green" },
    { bookId: 4, bookname: "catcher in the rye", author: "J.D. Salinger" },
    { bookId: 5, bookname: "fahrenheit 451", author: "Ray Bradbury" },
    { bookId: 6, bookname: "atomic habits", author: "James Clear" },
];
// The ID given to the next book created, so every book gets a unique ID.
let nextId = books.length + 1;

// Request details included in every response.
const metadata = (req) => ({ hostname: req.hostname, method: req.method });

// URL params are always strings ("4"), so convert to a number before
// comparing with the numeric IDs in the array.
// Only whole numbers like "4" count, so "0x4" or "4.0" don't match book 4.
const isBookId = (bookId) => /^\d+$/.test(bookId);
const findBook = (bookId) => (isBookId(bookId) ? books.find((book) => book.bookId === Number(bookId)) : undefined);

// 404 response for the by-ID routes when no book has that ID.
const notFound = (req, res) => {
    const { bookId } = req.params;
    res.status(404).json({
        message: `Book ${bookId} not found`,
        bookId,
        metadata: metadata(req),
    });
};

// A field counts as filled in when it's text with more than just spaces.
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

// 400 response for POST and PUT requests whose body is missing a field.
const fieldsRequired = (req, res) => {
    res.status(400).json({
        message: "bookname and author are required",
        metadata: metadata(req),
    });
};

// 1. GET: list every book in the data store.
// GET localhost:3000/books
router.get("/", (req, res) => {
    res.status(200).json({
        message: "Get all books",
        data: books,
        metadata: metadata(req),
    });
});

// 2. GET by ID: return one book.
// GET localhost:3000/books/:bookId (e.g. localhost:3000/books/4)
router.get("/:bookId", (req, res) => {
    const { bookId } = req.params;
    const book = findBook(bookId);
    if (!book) return notFound(req, res);

    res.status(200).json({
        message: "Get book by ID",
        bookId,
        data: book,
        metadata: metadata(req),
    });
});

// 3. POST: create a book and add it to the data store.
// POST localhost:3000/books
// Body (raw JSON): { "bookname": "dune", "author": "Frank Herbert" }
router.post("/", (req, res) => {
    // req.body is undefined when no JSON body is sent, so fall back to {}.
    const { bookname, author } = req.body ?? {};
    if (!isFilled(bookname) || !isFilled(author)) return fieldsRequired(req, res);

    const book = { bookId: nextId++, bookname, author };
    books.push(book);

    // 201 Created: a new resource was added.
    res.status(201).json({
        message: "Book created",
        data: book,
        metadata: metadata(req),
    });
});

// 4. PUT by ID: replace an existing book's bookname and author.
// PUT localhost:3000/books/:bookId (e.g. localhost:3000/books/2)
// Body (raw JSON): { "bookname": "an abundance of katherines", "author": "John Green" }
router.put("/:bookId", (req, res) => {
    const { bookId } = req.params;
    const book = findBook(bookId);
    if (!book) return notFound(req, res);

    const { bookname, author } = req.body ?? {};
    if (!isFilled(bookname) || !isFilled(author)) return fieldsRequired(req, res);

    // findBook returns the object stored in the array, so changing it here
    // updates the data store directly.
    book.bookname = bookname;
    book.author = author;

    res.status(200).json({
        message: "Book updated",
        bookId,
        data: book,
        metadata: metadata(req),
    });
});

// 5. DELETE by ID: remove a book from the data store.
// DELETE localhost:3000/books/:bookId (e.g. localhost:3000/books/6)
router.delete("/:bookId", (req, res) => {
    const { bookId } = req.params;
    // findIndex returns -1 when no book has that ID.
    const index = isBookId(bookId) ? books.findIndex((book) => book.bookId === Number(bookId)) : -1;
    if (index === -1) return notFound(req, res);

    // splice removes the book from the array and returns it in a new array.
    const [deleted] = books.splice(index, 1);

    res.status(200).json({
        message: "Book deleted",
        bookId,
        data: deleted,
        metadata: metadata(req),
    });
});

module.exports = router;
