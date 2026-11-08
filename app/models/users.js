// User model: the CRUD functions that read and write the users data file.
// Every function reads the file first, so it always works with the last saved
// data, and every change is written straight back to the file.
const fs = require('fs');
const path = require('path');

// The file the users are saved in. Tests set USERS_FILE to a temporary file
// so they never change the real app/data/users.json.
const dataFile = () => process.env.USERS_FILE || path.join(__dirname, '..', 'data', 'users.json');

// Read every user from the file. A missing file means no users have been saved yet.
const loadUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

// Write every user to the file, creating the data folder if it doesn't exist.
const saveUsers = (users) => {
    const file = dataFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(users, null, 2));
};

// URL params are always strings ("45"), so convert to a number before
// comparing with the numeric IDs in the file.
// Only whole numbers like "45" count, so "0x2d" or "45.0" don't match user 45.
const hasId = (id) => (user) => /^\d+$/.test(String(id)) && user.id === Number(id);

// 1. Read: every user in the file.
const getUsers = () => loadUsers();

// 2. Read by ID: one user, or undefined when no user has that ID.
const getUserById = (id) => loadUsers().find(hasId(id));

// 3. Create: add a user to the file and return it.
// The new ID is one more than the highest saved ID, so every user gets a unique ID.
const createUser = ({ name, email }) => {
    const users = loadUsers();
    const user = { id: Math.max(0, ...users.map((u) => u.id)) + 1, name, email };
    users.push(user);
    saveUsers(users);
    return user;
};

// 4. Update by ID: replace a user's name and email, or return undefined
// (without writing the file) when no user has that ID.
const updateUser = (id, { name, email }) => {
    const users = loadUsers();
    const user = users.find(hasId(id));
    if (!user) return undefined;

    user.name = name;
    user.email = email;
    saveUsers(users);
    return user;
};

// 5. Delete by ID: remove a user from the file and return it, or return
// undefined (without writing the file) when no user has that ID.
const deleteUser = (id) => {
    const users = loadUsers();
    const index = users.findIndex(hasId(id));
    if (index === -1) return undefined;

    // splice removes the user from the array and returns it in a new array.
    const [deleted] = users.splice(index, 1);
    saveUsers(users);
    return deleted;
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
