//file: server.js
 
const express = require("express");
const crypto = require('crypto');
const session = require("express-session");
const pool = require('./db');
const auth = require("./auth");
require("dotenv").config();

const app = express();
const saltRounds = 10;

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false} // would be set to true if using HTTPS
  })
);

// app.post("/register", auth.register);
app.post("/register", async (req, res) => {

  console.log("server.js: register ");
  const { username, email, password, role } = req.body;

  console.log(`server.js: register username: ${username}`);
  console.log(`server.js: register email: ${email}`);
  console.log(`server.js: register password: ${password}`);
  console.log(`server.js: register role: ${role}`);

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");

  const query = 'INSERT INTO users (username, email, hash, salt, role) VALUES ($1, $2, $3, $4, $5) RETURNING id';

  const values = [username, email, hash, salt, role];
  console.log("trying query with these values...");
  console.log(values);

  try {
    const result = await pool.query(query, values);
    console.log("user NOW registered ... going to respond");
    console.log(result);
    res.json({ success: true, message: `${role} account created`, username: `${username}` }); 
  } catch (error) {
    console.log("in catch block of server.js/register");
    console.log(error);
    res.json({ success: false, message: 'Username or email already exists.' });
  }
});

app.post("/login", auth.login);

app.get("/users", auth.ensureAdmin, async (req, res) => {
  console.log("in GET /users");
  const limit = parseInt(req.query.limit) || 1000;

  try {
    const result = await pool.query("SELECT username, email, role FROM users LIMIT $1", [limit]);
    console.log(`GET /users rows: ${result.rows}`);
    res.json(result.rows);
  } catch (error) {
    console.error("Errorin GET /users:", error);
    res.status(500).json({message: "Error retreiving users "});
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

app.get("/session", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

//app.post("/api/users/truncate", auth.ensureAdmin, async (req, res) => {
app.post("/users/truncate", auth.ensureAdmin, async (req, res) => {
  console.log("TRUNCATE endpoint. Session user:", req.session.user);
  try {
    await pool.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    res.json({ success: true, message: "Users table truncated." });
  } catch (error) {
    console.error("Error truncating users table:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.post("/users/insert-row", auth.ensureAdmin, async (req, res) => {
  const {username, email, role} = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const result = await pool.query("INSERT INTO users (username, email, role) VALUES ($1, $2, $3)",
      [username, email, role]
    );
    res.json({ success: true, message: "User added" });
  } catch (error) {
    console.error("Error inserting row:", error);
    res.status(500).json({ success: false, message: "Insert failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));