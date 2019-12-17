const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");

const { NODE_ENV } = require("./config");
const bookmarksRouter = require("./bookmarks/bookmarks-router");

const errorHandler = require("./handle-error");

const app = express();
const jsonParser = express.json();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/bookmarks", bookmarksRouter);
app.use(errorHandler);

app.post("/bookmarks", jsonParser, (req, res, next) => {
  res
    .status(201)
    .json({
      ...req.body,
      id: 12
    })
    .then(postRes => {
      supertest(app)
        .get(`/bookmarks/${postRes.body.id}`)
        .expect(postRes.body);
    });
});

module.exports = app;
