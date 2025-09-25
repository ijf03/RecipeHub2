const mongoose = require("mongoose");
const express = require("express");

const inventoryRouter = require("./routes/book-routes");
const recipeRouter = require("./routes/rental-routes");
const userRouter = require("./routes/rental-routes");

const app = express();
app.listen(8080);

app.use(express.json());

const url = "mongodb://localhost:27017/";

async function connect(url) {
	await mongoose.connect(url);
	return "Connected Successfully";
}

app.use("/inventory", inventoryRouter);
app.use("/recipe", recipeRouter);
app.use("/user", userRouter);

connect(url)
	.then(console.log)
	.catch((err) => console.log(err));
