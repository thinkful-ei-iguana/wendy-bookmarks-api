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
      context("Given no bookmarks", () => {
        it("responds with 404", () => {
          const bookmarkId = 9999;
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
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
      context("Given an XSS attack article", () => {
        const maliciousBookmark = {
          id: 911,
          title: "bad <script>alert('xss');</script>",
          url: "http://bad.com",
          rating: 1,
          description: `Bad image <img src='https://url.to.file.which/does-not.exist' onerror='alert(document.cookie);'>. But not <strong>all</strong> bad.`
        };
        beforeEach("insert malicious article", () => {
          return db.into("bookmarks").insert([maliciousBookmark]);
        });
        it("removes XSS attack content", () => {
          return supertest(app)
            .get(`/bookmarks/${maliciousBookmark.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.title).to.eql(
                `bad &lt;script&gt;alert('xss');&lt;/script&gt;`
              );
              expect(res.body.description).to.eql(
                `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
              );
            });
        });
      });
    });
  });
  describe("POST /bookmarks", () => {
    it("creates a bookmark, responding with 201 and the new bookmark", function() {
      this.retries(3);
      const newBookmark = {
        title: "test",
        url: "http://example.com",
        rating: "3",
        description: "test"
      };
      return supertest(app)
        .post("/bookmarks")
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        });
    });
    const requiredFields = ["title", "url", "rating"];
    requiredFields.forEach(field => {
      const newBookmark = {
        title: "test new title",
        url: "http://test.com",
        rating: 5,
        description: "test content"
      };
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];
        return supertest(app)
          .post("/bookmarks")
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });
  });
  describe("DELETE /bookmarks/:bookmark_id", () => {
    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });
      it("responds with 204 and removes the bookmark", () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          bookmark => bookmark.id !== idToRemove
        );
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get("/bookmarks")
              .expect(expectedBookmarks)
          );
      });
    });
    context("Given no bookmarks", () => {
      it("responds with 404", () => {
        const bookmarkId = 99999;
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: "Bookmark doesn't exist" } });
      });
    });
  });
});
