// database.js

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('records.db');

// Initialize the database
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            roverNumber TEXT NOT NULL,
            employeeID TEXT NOT NULL,
            action TEXT NOT NULL
        )
    `);
});

module.exports = db;
