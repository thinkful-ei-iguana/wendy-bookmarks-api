const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");

const { NODE_ENV } = require("./config");
const bookmarksRouter = require("./bookmarks/bookmarks-router");

const errorHandler = require("./handle-error");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api/bookmarks", bookmarksRouter);
app.use(errorHandler);

module.exports = app;
