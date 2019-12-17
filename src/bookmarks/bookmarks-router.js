const express = require("express");
const bookmarksRouter = express.Router();
const BookmarksService = require("./bookmarks-service");

bookmarksRouter.route("/").get((req, res, next) => {
  const knexInstance = req.app.get("db");
  BookmarksService.getAllBookmarks(knexInstance)
    .then(bookmarks => {
      res.json(bookmarks);
    })
    .catch(next);
});

bookmarksRouter.route("/:bookmark_id").get((req, res, next) => {
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
module.exports = bookmarksRouter;
