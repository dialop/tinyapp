// ------------ HELPER TEST CASES --------------- //
const { assert } = require("chai");

const { getUserByEmail, urlsForUser, generateRandomString, } = require("../helpers");

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

describe("getUserByEmail", function() {
  it("should return a user with valid email", function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });

  it("should return undefined for non-existent email", function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.isUndefined(user);
  });

});



describe("urlsForUser", function() {
  it("should return an object of url information specific to the given user ID", function() {
    const userURLs = urlsForUser("aJ481W", testUrlDatabase);
    const expectedUserURLs = {
      b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
      i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
    };
    assert.deepEqual(userURLs, expectedUserURLs);
  });

  it("should return an empty object if no url exist for the given user ID", function() {
    const noExistingUrls = urlsForUser("invalidUser", testUrlDatabase);
    const expectedUserURLs = {};
    assert.deepEqual(noExistingUrls, expectedUserURLs);
  });
});




describe('generateRandomString', function() {

  it('should return a random string with six characters', function() {
    const randomStringLength = generateRandomString().length;
    const expectedOutput = 6;
    assert.equal(randomStringLength, expectedOutput);
  });

  it('should not return the same string when called various times', function() {
    const firstRandomString = generateRandomString();
    const secondRandomString = generateRandomString();
    assert.notEqual(firstRandomString, secondRandomString);
  });
});
