// ---------------------- HELPER FUNCTIONS ------------------------- //

// --- Function to searches if email exists in database --- //
const getUserByEmail = function(email, database) {
  return Object.values(database).find(user => user.email === email);
};
  

// --- Function that URLs associated with a specific user ID --- //
const urlsForUser = function(id, urlDatabase) {
  const userURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};
  

// --- Function that generates a random character strings for user ID and URLs --- //
const generateRandomString = function(length) {
  let randomString = "";
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };