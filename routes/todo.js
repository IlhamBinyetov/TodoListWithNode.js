const express = require('express');
const router = require("express").Router();
const flash = require("express-flash");
const { pool } = require("../src/config");

router.post("/add/todo", async (req, res) => {
    console.log(req.body);
    const { todo } = req.body;

    if(todo.length> 100){
        req.flash("error_msg", "Todo item must not exceed 100 characters.");
        return res.redirect("/home");
    }
    console.log("todoList" + req.body);
    try {
        const insertQuery = await pool.query(
            `INSERT INTO "TodoLists" (name) VALUES ($1) RETURNING id`,
            [todo]
        );
        req.flash("success_msg", "To-do item added successfully!");
        res.redirect("/home");
    } catch (err) {
        console.error(err);
        req.flash("error_msg", "Failed to add to-do item.");
        res.redirect("/home");
    }
});

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM "TodoLists" ORDER BY id`);
        console.log('result ' + result)
        res.render("home", { todos: result.rows });
    } catch (err) {
        console.error(err);
        req.flash("error_msg", "Failed to load to-do items.");
        res.render("home", { todos: [] });
    }
});

router.get("/delete/todo/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deleteQuery = await pool.query(
            `DELETE FROM "TodoLists" WHERE id = $1`,
            [id]
        );
        req.flash("success_msg", "To-do item deleted successfully!");
        res.redirect("/home");
    } catch (err) {
        console.error(err);
        req.flash("error_msg", "Failed to delete to-do item.");
        res.redirect("/home");
    }
});

module.exports = router;