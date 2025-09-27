const mongoose = require("mongoose");
const express = require("express");
const User = require('./models/user');

const path = require("path");
const { SID, PORT, MONGO_URL } = require("./config/constants");

const recipeRouter = require("./routes/recipe-routes");
const inventoryRouter = require("./routes/inventory-routes");
const userRouter = require('./routes/user-routes');

const app = express();

function readUserId(req) {
  if (req.method === 'GET') return (req.query && req.query.userId) || '';
  if (req.method === 'POST') return (req.body && req.body.userId)  || (req.query && req.query.userId) || '';
  return '';
}

// views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/bootstrap', express.static(
  path.join(__dirname, 'node_modules', 'bootstrap', 'dist')
));

app.use(async (req, res, next) => {
  try {
    const userId = readUserId(req);
    let currentUser = null;

    if (userId) {
      currentUser = await User.findOne({ userId, isLoggedIn: true })
        .select('userId fullName email role')
        .lean();
    }

    res.locals.SID = app.locals.SID;
    res.locals.currentUser = currentUser;
    res.locals.userIdParam = userId || '';

    req.userIdParam = userId;
    req.currentUser = currentUser;
    next();
  } catch (e) { next(e); }
});

app.locals.SID =SID;


// DB connect
const { connectDB } = require('./config/db');
connectDB(MONGO_URL);

//ROUTERS
app.use("/", recipeRouter);
app.use("/", inventoryRouter);
app.use('/', userRouter);  
    

// Home
app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Home',
    name: 'Student',
    studentId: req.app.locals.SID,
    SID: req.app.locals.SID
  });
});

// 404
app.use((req, res) => res.status(404).render("errors/404", { pageTitle: "Not Found", url: req.originalUrl }));

app.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
