

const express = require('express');
const router = express.Router();

// The CRUD functions that read and write app/data/users.json.
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../models/users');

// Request details included in every response.
const metadata = (req) => ({ hostname: req.hostname, method: req.method });

// 404 response for the by-ID routes when no user has that ID.
// The ID from the URL is still included in the output.
const notFound = (req, res) => {
    const { id } = req.params;
    res.status(404).json({
        message: `User ${id} not found`,
        id,
        metadata: metadata(req),
    });
};

// A field counts as filled in when it's text with more than just spaces.
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

// 400 response for POST and PUT requests whose body has no name.
const nameRequired = (req, res) => {
    res.status(400).json({
        message: "name is required",
        metadata: metadata(req),
    });
};

// 1. GET: list every user in the data store.
// GET localhost:3000/users

router.get("/", (req, res) => {
    res.status(200).json({
        message: "Get all users",
        data: getUsers(),
        metadata: metadata(req),
    });
});

// 2. GET by ID: return one user.
// GET localhost:3000/users/:id (e.g. localhost:3000/users/45)

router.get("/:id", (req, res) => {
    // The ID comes from the URL, e.g. "45" in /users/45.
    const { id } = req.params;
    const user = getUserById(id);
    if (!user) return notFound(req, res);

    res.status(200).json({
        message: "Get user by ID",
        id,
        data: user,
        metadata: metadata(req),
    });
});


// 3. POST: create a user and add it to the data store.
// POST localhost:3000/users


router.post("/", (req, res) => {
    // req.body is undefined when no JSON body is sent, so fall back to {}.
    const { name, email } = req.body ?? {};
    if (!isFilled(name)) return nameRequired(req, res);

    const user = createUser({ name, email });

    // 201 Created: a new resource was added.
    res.status(201).json({
        message: "User created",
        data: user,
        metadata: metadata(req),
    });
});


// 4. PUT by ID: replace an existing user's name and email.
// PUT localhost:3000/users/:id 

router.put("/:id", (req, res) => {
    const { id } = req.params;
    if (!getUserById(id)) return notFound(req, res);

    const { name, email } = req.body ?? {};
    if (!isFilled(name)) return nameRequired(req, res);

    const user = updateUser(id, { name, email });

    res.status(200).json({
        message: "User updated",
        id,
        data: user,
        metadata: metadata(req),
    });
});


// 5. DELETE by ID: remove a user from the data store.

// DELETE localhost:3000/users/:id (e.g. localhost:3000/users/9)


router.delete("/:id", (req, res) => {
    const { id } = req.params;
    const deleted = deleteUser(id);
    if (!deleted) return notFound(req, res);

    res.status(200).json({
        message: "User deleted",
        id,
        data: deleted,
        metadata: metadata(req),
    });
});

module.exports = router;
