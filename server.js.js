const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database(path.join(__dirname, "school_gps.db"));

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      age INTEGER,
      gender TEXT,
      mother_name TEXT,
      father_name TEXT,
      parent_mobile TEXT,
      student_mobile TEXT,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS parent_children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      UNIQUE(parent_id, student_id),
      FOREIGN KEY(parent_id) REFERENCES parents(id),
      FOREIGN KEY(student_id) REFERENCES students(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_id TEXT UNIQUE NOT NULL,
      subject TEXT,
      mobile TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      started_at TEXT,
      stopped_at TEXT,
      active INTEGER DEFAULT 1,
      FOREIGN KEY(student_id) REFERENCES students(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      trip_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY(student_id) REFERENCES students(id),
      FOREIGN KEY(trip_id) REFERENCES trips(id)
    )
  `);
}

function ok(res, data = {}) {
  res.json({ ok: true, ...data });
}

function fail(res, message, code = 400) {
  res.status(code).json({ ok: false, message });
}

async function getStudentByRoll(roll) {
  return await get(`SELECT * FROM students WHERE roll_number = ?`, [roll]);
}

async function getActiveTrip(studentId) {
  return await get(
    `SELECT * FROM trips WHERE student_id = ? AND active = 1 ORDER BY id DESC LIMIT 1`,
    [studentId]
  );
}

async function getLatestLocation(studentId) {
  return await get(
    `SELECT * FROM locations WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
    [studentId]
  );
}

function travelStatusFromTrip(trip, latestLocation) {
  if (!trip || !trip.started_at) return "Not Started";
  if (trip.started_at && !trip.stopped_at) return latestLocation ? "Travelling" : "Started";
  return "Reached / Stopped";
}

/* ---------------- HOME ROUTE ---------------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ---------------- STUDENT ---------------- */
app.post("/api/students/register", async (req, res) => {
  try {
    const {
      name,
      rollNumber,
      age,
      gender,
      motherName,
      fatherName,
      parentMobileNumber,
      studentMobileNumber
    } = req.body;

    if (!name || !rollNumber) {
      return fail(res, "Name and Roll Number are required.");
    }

    const exists = await getStudentByRoll(rollNumber);
    if (exists) return fail(res, "Roll Number already registered.");

    await run(
      `INSERT INTO students
      (name, roll_number, age, gender, mother_name, father_name, parent_mobile, student_mobile)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        rollNumber,
        age || null,
        gender || null,
        motherName || "",
        fatherName || "",
        parentMobileNumber || "",
        studentMobileNumber || ""
      ]
    );

    ok(res, { rollNumber });
  } catch (e) {
    console.error(e);
    fail(res, "Student registration failed.");
  }
});

app.post("/api/students/set-password", async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return fail(res, "Roll Number and Password are required.");
    }

    const student = await getStudentByRoll(rollNumber);
    if (!student) {
      return fail(res, "Roll Number not found. Please register first.");
    }

    const hash = await bcrypt.hash(password, 10);
    await run(`UPDATE students SET password_hash = ? WHERE roll_number = ?`, [hash, rollNumber]);

    ok(res, { message: "Student registered successfully." });
  } catch (e) {
    console.error(e);
    fail(res, "Password setup failed.");
  }
});

app.post("/api/students/login", async (req, res) => {
  try {
    const { rollNumber, password } = req.body;
    const student = await getStudentByRoll(rollNumber);

    if (!student) {
      return fail(res, "Roll Number not found. Please register first.", 404);
    }

    if (!student.password_hash) {
      return fail(res, "Password not set. Please complete registration.");
    }

    const matched = await bcrypt.compare(password, student.password_hash);
    if (!matched) return fail(res, "Invalid password.");

    ok(res, {
      user: {
        role: "student",
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number
      }
    });
  } catch (e) {
    console.error(e);
    fail(res, "Student login failed.");
  }
});

/* ---------------- PARENT ---------------- */
app.post("/api/parents/register", async (req, res) => {
  try {
    const { parentName, childRollNumber, mobile, email, password } = req.body;

    if (!parentName || !childRollNumber || !mobile || !email || !password) {
      return fail(res, "All parent fields are required.");
    }

    const student = await getStudentByRoll(childRollNumber);
    if (!student) return fail(res, "Child Roll Number not found in student database.");

    let parent = await get(`SELECT * FROM parents WHERE email = ?`, [email]);
    let parentId;

    if (!parent) {
      const hash = await bcrypt.hash(password, 10);
      const result = await run(
        `INSERT INTO parents (parent_name, mobile, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [parentName, mobile, email, hash]
      );
      parentId = result.lastID;
    } else {
      const matched = await bcrypt.compare(password, parent.password_hash);
      if (!matched) {
        return fail(
          res,
          "This email is already used. Use the same password to add another child, or use a different email."
        );
      }
      parentId = parent.id;
    }

    await run(
      `INSERT OR IGNORE INTO parent_children (parent_id, student_id) VALUES (?, ?)`,
      [parentId, student.id]
    );

    ok(res, { message: "Parent registered and child mapping saved successfully." });
  } catch (e) {
    console.error(e);
    fail(res, "Parent registration failed.");
  }
});

app.post("/api/parents/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const parent = await get(`SELECT * FROM parents WHERE email = ?`, [email]);

    if (!parent) return fail(res, "Parent account not found.");

    const matched = await bcrypt.compare(password, parent.password_hash);
    if (!matched) return fail(res, "Invalid password.");

    const children = await all(
      `
      SELECT s.id, s.name, s.roll_number
      FROM parent_children pc
      JOIN students s ON s.id = pc.student_id
      WHERE pc.parent_id = ?
      ORDER BY s.name
      `,
      [parent.id]
    );

    ok(res, {
      user: {
        role: "parent",
        id: parent.id,
        name: parent.parent_name,
        email: parent.email,
        children
      }
    });
  } catch (e) {
    console.error(e);
    fail(res, "Parent login failed.");
  }
});

/* ---------------- TEACHER ---------------- */
app.post("/api/teachers/register", async (req, res) => {
  try {
    const { name, teacherId, subject, mobile, email, password } = req.body;

    if (!name || !teacherId || !subject || !mobile || !email || !password) {
      return fail(res, "All teacher fields are required.");
    }

    const exists = await get(
      `SELECT * FROM teachers WHERE teacher_id = ? OR email = ?`,
      [teacherId, email]
    );
    if (exists) return fail(res, "Teacher already registered with this ID or Email.");

    const hash = await bcrypt.hash(password, 10);
    await run(
      `INSERT INTO teachers (name, teacher_id, subject, mobile, email, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, teacherId, subject, mobile, email, hash]
    );

    ok(res, { message: "Teacher registered successfully." });
  } catch (e) {
    console.error(e);
    fail(res, "Teacher registration failed.");
  }
});

app.post("/api/teachers/login", async (req, res) => {
  try {
    const { teacherId, password } = req.body;
    const teacher = await get(`SELECT * FROM teachers WHERE teacher_id = ?`, [teacherId]);

    if (!teacher) return fail(res, "Teacher ID not found.");

    const matched = await bcrypt.compare(password, teacher.password_hash);
    if (!matched) return fail(res, "Invalid password.");

    ok(res, {
      user: {
        role: "teacher",
        id: teacher.id,
        name: teacher.name,
        teacherId: teacher.teacher_id,
        subject: teacher.subject
      }
    });
  } catch (e) {
    console.error(e);
    fail(res, "Teacher login failed.");
  }
});

/* ---------------- STUDENT LIST ---------------- */
app.get("/api/students", async (req, res) => {
  try {
    const students = await all(
      `SELECT id, name, roll_number FROM students ORDER BY name ASC`
    );
    ok(res, { students });
  } catch (e) {
    console.error(e);
    fail(res, "Failed to fetch students.");
  }
});

/* ---------------- STATUS / TRACKING ---------------- */
app.get("/api/student-status/:rollNumber", async (req, res) => {
  try {
    const student = await getStudentByRoll(req.params.rollNumber);
    if (!student) return fail(res, "Student not found.", 404);

    const trip = await get(
      `SELECT * FROM trips WHERE student_id = ? ORDER BY id DESC LIMIT 1`,
      [student.id]
    );

    const latestLocation = await getLatestLocation(student.id);
    const locations = trip
      ? await all(
          `SELECT latitude, longitude, speed, created_at
           FROM locations
           WHERE trip_id = ?
           ORDER BY id ASC`,
          [trip.id]
        )
      : [];

    const status = travelStatusFromTrip(trip, latestLocation);

    ok(res, {
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.roll_number
      },
      trip: {
        startedAt: trip?.started_at || null,
        stoppedAt: trip?.stopped_at || null,
        status
      },
      latestLocation: latestLocation || null,
      locations
    });
  } catch (e) {
    console.error(e);
    fail(res, "Failed to get student status.");
  }
});

app.post("/api/tracking/start/:rollNumber", async (req, res) => {
  try {
    const student = await getStudentByRoll(req.params.rollNumber);
    if (!student) return fail(res, "Student not found.", 404);

    await run(`UPDATE trips SET active = 0 WHERE student_id = ? AND active = 1`, [student.id]);
    await run(
      `INSERT INTO trips (student_id, started_at, active) VALUES (?, ?, 1)`,
      [student.id, new Date().toISOString()]
    );

    ok(res, { message: "Tracking started." });
  } catch (e) {
    console.error(e);
    fail(res, "Failed to start tracking.");
  }
});

app.post("/api/tracking/stop/:rollNumber", async (req, res) => {
  try {
    const student = await getStudentByRoll(req.params.rollNumber);
    if (!student) return fail(res, "Student not found.", 404);

    const trip = await getActiveTrip(student.id);
    if (!trip) return fail(res, "No active trip found.");

    await run(
      `UPDATE trips SET stopped_at = ?, active = 0 WHERE id = ?`,
      [new Date().toISOString(), trip.id]
    );

    ok(res, { message: "Tracking stopped." });
  } catch (e) {
    console.error(e);
    fail(res, "Failed to stop tracking.");
  }
});

app.post("/api/location/:rollNumber", async (req, res) => {
  try {
    const student = await getStudentByRoll(req.params.rollNumber);
    if (!student) return fail(res, "Student not found.", 404);

    const { latitude, longitude, speed } = req.body;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return fail(res, "Invalid coordinates.");
    }

    const trip = await getActiveTrip(student.id);
    if (!trip) return fail(res, "No active trip. Press Start first.");

    await run(
      `INSERT INTO locations (student_id, trip_id, latitude, longitude, speed, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student.id,
        trip.id,
        latitude,
        longitude,
        speed || 0,
        new Date().toISOString()
      ]
    );

    ok(res, { message: "Location saved." });
  } catch (e) {
    console.error(e);
    fail(res, "Failed to save location.");
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, async () => {
  try {
    await initDb();
    console.log(`Server running on port ${PORT}`);
  } catch (e) {
    console.error("DB init failed:", e);
  }
});