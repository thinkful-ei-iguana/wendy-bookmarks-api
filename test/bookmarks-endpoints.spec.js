const { expect } = require("chai");
const knex = require("knex");
const app = require("../src/app");
const { makeBookmarksArray } = require("./bookmarks.fixtures");

describe("Bookmarks endpoints", function() {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () => db("bookmarks").truncate());

  afterEach("clean the table", () => db("bookmarks").truncate());

  describe("GET /bookmarks", () => {
    context("Given no data in database", () => {
      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/bookmarks")
          .expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("GET /bookmarks responds with 200 and all of the bookmarks", () => {
        return supertest(app)
          .get("/bookmarks")
          .expect(200, testBookmarks);
      });
    });

    describe("GET /bookmarks/:bookmark_id", () => {
      context.skip("Given no bookmarks", () => {
        it("responds with 404", () => {
          const bookmarkId = 9999;
          return supertest(app)
            .get("/bookmarks/bookmarkId")
            .expect(404, { error: { message: "Bookmark doesn't exist" } });
        });
      });
      context("Given there are bookmarks in the database", () => {
        const testBookmarks = makeBookmarksArray();

        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });

        it("GET /bookmarks/:bookmarks_id responds with 200 and the specified bookmark", () => {
          const bookmarkId = 2;
          const expectedBookmark = testBookmarks[bookmarkId - 1];
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .expect(200, expectedBookmark);
        });
      });
    });
  });
  describe("POST /bookmarks", () => {
    it("creates a bookmark, responding with 201 and the new bookmark", () => {
      const newBookmark = {
        title: "test",
        url: "http://example.com",
        rating: "3",
        description: "test"
      };
      return supertest(app)
        .post("/bookmarks")
        .send(newBookmark)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property("id");
        });
    });
  });
});
