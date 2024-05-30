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
app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
});

app.get("/login", checkAuthenticated, (req, res) => {
    res.render("login.ejs");
});

app.get("/dashboard", checkNotAuthenticated, (req, res) => {
    console.log(req.isAuthenticated());
    res.render("dashboard", { user: req.user.name });
});
app.get("/logout", (req, res, next) => {
    req.logout((err) =>{
      return next(err);
    });
    res.render("login", { message: "You have logged out successfully" });
});

app.post("/signup", async (req, res) => {
    let { name, email, password, surname } = req.body;
    console.log(name, email,password,surname);
  
    let errors = [];
  
    console.log({name,email,password,surname});
  
    if (!name || !email || !password || !surname) {
      errors.push({ message: "Please enter all fields" });
    }
  
    if (password.length < 6) {
      errors.push({ message: "Password must be a least 6 characters long" });
    }
    if (errors.length > 0) {
      res.render("signup", { errors, name, email, password, surname });
    } else {
      var hashedPassword = await bcrypt.hash(req.body.password, 10);
     
      // Validation passed
      pool.query(
        `SELECT * FROM "ApplicationUsers"
          WHERE email = $1`,
        [req.body.email],
        (err, results) => {
          if (err) {
            throw err;
          }
          
  
          if (results && results.rows.length > 0) {
            errors.push({message: "Email already registered"})
            return res.render("signup", errors);
          } else {
            pool.query(
              `INSERT INTO "ApplicationUsers" (name,surname, email, password)
                  VALUES ($1, $2, $3, $4)
                  RETURNING id, password`,
              [name,surname, email, hashedPassword],
              
              (err, results) => {
                
                if (err) {
                  throw err;
                }
                
                req.flash("success_msg", "You are now registered. Please log in");
                res.redirect("/login");
              }
            );
          }
        }
      );
    }
  });

  app.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: true
    })
  );



  function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/dashboard");
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