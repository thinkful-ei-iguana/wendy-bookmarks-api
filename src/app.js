require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { NODE_ENV } = require("./config");
const BookmarksService = require("./bookmarks-service");
const app = express();
const jsonParser = express.json();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.get("/bookmarks", (req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks);
    })
    .catch(next);
});

app.get("/bookmarks/:bookmark_id", (req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksService.getById(knexInstance, req.params.bookmark_id)
    .then(bookmark => {
      if (!bookmark) {
        return res
          .status(404)
          .json({ error: { message: "Bookmark doesn't exist" } });
      }
      res.json(bookmark);
    })
    .catch(next);
});

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

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(404).json(response);
});

module.exports = app;
