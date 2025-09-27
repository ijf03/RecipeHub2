const mongoose = require("mongoose");
const express = require("express");

const path = require("path");
const { SID, PORT, MONGO_URL } = require("./config/constants");

const recipeRouter = require("./routes/recipe-routes");
const inventoryRouter = require("./routes/inventory-routes");

const app = express();

// views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/bootstrap', express.static(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist')
));

app.locals.SID =SID;


// DB connect
const { connectDB } = require('./config/db');
connectDB(MONGO_URL);

//ROUTERS
app.use("/", recipeRouter);
app.use("/", inventoryRouter);

// Home
app.get("/", (req, res) => res.redirect(`/recipes-${SID}`));

// 404
app.use((req, res) => res.status(404).render("errors/404", { pageTitle: "Not Found", url: req.originalUrl }));

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
