require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
// const authJwt = require("./helper/jwt");
const errrorHandler = require("./helper/error-handler");

const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

//Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
// app.use(authJwt());
app.use(errrorHandler);

//Routers
const productsRouter = require("./routers/products");
const usersRouter = require("./routers/users");
const categoriesRouter = require("./routers/categories");
const ordersRouter = require("./routers/orders");

app.use(`${api}/products`, productsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/categories`, categoriesRouter);
app.use(`${api}/orders`, ordersRouter);

//Database
mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("Database connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server is running!! http://localhost:3000");
});
