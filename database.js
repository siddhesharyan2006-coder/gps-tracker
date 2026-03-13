const sqlite3 = require("sqlite3").verbose();

/* CREATE DATABASE FILE */
const db = new sqlite3.Database("./safety_tracker.db", (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});


/* CREATE USERS TABLE */

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    roll TEXT,
    password TEXT
)
`);


/* CREATE TRACKING TABLE */

db.run(`
CREATE TABLE IF NOT EXISTS tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roll TEXT,
    latitude REAL,
    longitude REAL,
    time TEXT
)
`);


module.exports = db;
