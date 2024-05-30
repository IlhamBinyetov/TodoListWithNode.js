//importing libraries that we installed using npm
const express = require('express');
const { pool } = require("./config");
const bcrypt = require('bcrypt');
const flash = require("express-flash");
const passport = require("passport");
const session = require("express-session");

require("dotenv").config();
const app = express();

//const PORT = process.env.PORT || 3000;
const initializePassport = require("../passportConfig");
initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false
    })
  );

  app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());


//routers
app.get("/",(req,res)=>{
    res.render("login.ejs");
});
app.get("/signup", checkAuthenticated,(req,res)=>{
    res.render("signup.ejs");
});

app.get("/login", checkAuthenticated, (req, res) => {
    res.render("login.ejs");
});

app.get("/home", checkNotAuthenticated, (req, res) => {
    //console.log(req.isAuthenticated());
    res.render("home", { user: req.user.name });
});
app.get("/logout", (req, res, next) => {
    req.logout((err) =>{
      return next(err);
    });
    res.render("login", { message: "You have logged out successfully" });
});

app.post("/signup", async (req, res) => {
  
    let { name, email, password, surname } = req.body;
    
    let errors = [];
    if (!name || !email || !password || !surname) {
      errors.push({ message: "Please enter all fields" });
    }
  
    if (password.length < 6) {
      errors.push({ message: "Password must be a least 6 characters long" });
    }
    if (errors.length > 0) {
      res.render("signup", { errors, name, email, password, surname });
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

    } catch (error) {
        console.error(err);
        errors.push({ message: "Something went wrong. Please try again." });
        res.render("signup", { errors, name, email, password, surname });
    }
    

});

  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/home",
      failureRedirect: "/login",
      failureFlash: true
    })
  );

  //routers end


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


const PORT = 6003;
app.listen(PORT, ()=>{
    console.log(`Server running on Port${PORT}`);
});