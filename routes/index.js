const express = require('express');
const { pool } = require("../src/config");
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require("passport");


const initializePassport = require("../passportConfig");


initializePassport(passport);
const app = express();
require("dotenv").config();

app.use(passport.initialize());




router.get("/signup", checkAuthenticated, (req, res) => {
    res.render("signup.ejs");
});

router.get("/login", checkAuthenticated, (req, res) => {
    res.render("login.ejs");
});

router.get("/home", checkNotAuthenticated, async (req, res) => {
    const result = await pool.query(`SELECT * FROM "TodoLists" ORDER BY id`);
    const todos = result.rows;
    res.render("home", { user: req.user.name, todos: todos });
});

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.render("login", { message: "You have logged out successfully" });
    });
});

router.post("/signup", async (req, res) => {
    let { name, email, password, surname } = req.body;
    let errors = [];
    if (!name || !email || !password || !surname) {
        errors.push({ message: "Please enter all fields" });
    }

    if ( email.length > 100 || password.length > 100) {
        errors.push({ message: "Email or passsword fields must not exceed 100 characters." });
    }

    if (name.length > 50 || surname.length > 50){
        errors.push({ message: "Name or Surname fields must not exceed 50 characters." });
    }

    if (password.length < 6) {
        errors.push({ message: "Password must be at least 6 characters long" });
    }

    if (errors.length > 0) {
        return res.render("signup", { errors, name, email, password, surname });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userQuery = await pool.query(
            `SELECT * FROM "ApplicationUsers" WHERE email = $1`,
            [email]
        );

        if (userQuery.rows.length > 0) {
            errors.push({ message: "Email already registered" });
            return res.render("signup", { errors, name, email, password, surname });
        }

        const insertQuery = await pool.query(
            `INSERT INTO "ApplicationUsers" (name, surname, email, password) VALUES ($1, $2, $3, $4) RETURNING id, password`,
            [name, surname, email, hashedPassword]
        );

        req.flash("success_msg", "You are now registered. Please log in");
        res.redirect("/login");
    } catch (err) {
        console.error(err);
        errors.push({ message: "Something went wrong. Please try again." });
        res.render("signup", { errors, name, email, password, surname });
    }
});

router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/home",
        failureRedirect: "/login",
        failureFlash: true
    })
);

  
  //routers end

// Middleware functions
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/home");
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
}



module.exports = router;