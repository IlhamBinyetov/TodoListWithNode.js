const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const dotenv = require('dotenv'); // Add this line
const app = express();

dotenv.config();

const initializePassport = require('../passportConfig');
initializePassport(passport);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


app.use(session({
    secret: 'process.env.SESSION_SECRET',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('errors');
    next();
});

app.get("/",(req,res)=>{
    res.render("login.ejs");
});
// routes
app.use(require("../routes/index"))
app.use(require("../routes/todo"))


// server configurations....
const PORT = 6003;
app.listen(PORT, ()=>{
    console.log(`Server running on Port${PORT}`);
});