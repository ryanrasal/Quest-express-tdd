// test/app.integration.spec.js
const request = require("supertest");
const app = require("../app");
const connection = require("../connection");

describe("Test routes", () => {
  beforeEach((done) => {
    connection.query("TRUNCATE bookmark", done);
  });
  it('GET / sends "Hello World" as json', (done) => {
    request(app)
      .get("/")
      .expect(200)
      .expect("Content-Type", /json/)
      .then((response) => {
        const expected = { message: "Hello World!" };
        expect(response.body).toEqual(expected);
        done();
      })
      .catch(done);
  });
  it("POST /bookmarks with missing fields should return an error", (done) => {
    request(app)
      .post("/bookmarks")
      .send({})
      .expect(422)
      .expect("Content-Type", /json/)
      .then((response) => {
        const expected = { error: "required field(s) missing" };
        expect(response.body).toEqual(expected);
        done();
      })
      .catch(done);
  });
  it("POST /bookmarkers insert OK", (done) => {
    request(app)
      .post("/bookmarks")
      .send({ url: "https://jestjs.io", title: "Jest" })
      .expect(201)
      .expect("Content-Type", /json/)
      .then((response) => {
        const expected = {
          id: expect.any(Number),
          url: "https://jestjs.io",
          title: "Jest",
        };
        expect(response.body).toEqual(expected);
        done();
      })
      .catch(done);
  });
  describe("GET /bookmarks/:id", () => {
    const testBookmark = { url: "https://nodejs.org/", title: "Node.js" };
    let bookmarkId;
    beforeEach((done) => {
      connection.query("TRUNCATE bookmark", () =>
        connection.query(
          "INSERT INTO bookmark SET ?",
          testBookmark,
          (err, result) => {
            bookmarkId = result.insertId;
            done(err);
          }
        )
      )
    });

    it("should return error for non-existent bookmark", (done) => {
      request(app)
        .get(`/bookmarks/222`)
        .expect(404)
        .expect("Content-Type", /json/)
        .then((response) => {
          const expected = { error: "Bookmark not found" };
          expect(response.body).toEqual(expected);
          done();
        })
        .catch(done);
    });
    it("should return bookmark for existing id", (done) => {
      request(app)
        .get(`/bookmarks/${bookmarkId}`)
        .expect(200)
        .expect("Content-Type", /json/)
        .then((response) => {
          const expected = { id: bookmarkId, ...testBookmark };
          expect(response.body).toEqual(expected);
          done();
        })
        .catch(done);
    });
  });
});
