//  -------------------- PORT -------------------- //

const PORT = 8080; // default port

// -------------------- DEPENDENCIES --------------- //

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");
const { users, urlDatabase } = require("./database");


// -------------------- MIDDLEWARE ---------------- //

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["secret_key_for_encryption"],
  maxAge: 24 * 60 * 60 * 1000
}));

// -------------------- GET ROUTE HANDLERS -------------------- //

// --- Redirect root path to login or URLs page --- //
app.get("/", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    return res.redirect("/login");
  }
  return res.redirect("/urls");
});

// --- Renders Main Page --- //
app.get("/urls", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    return res.status(401).send("You must be logged in to view this page.");
  }
  const userURLs = urlsForUser(user.id, urlDatabase);
  const templateVars = {
    user: user,
    urls: userURLs,
  };
  return res.render("urls_index", templateVars);
});

// --- Renders page to create a new URL if not logged in, redirects to login page --- //
app.get("/urls/new", (req, res) => {
  const user = users[req.session.userId];
  if (!user) {
    return res.redirect("/login");
  }
    
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// ---  Route used to display URL details, including the long URL associated with a short URL --- //
app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const user = users[req.session.userId];

  if (!user) {
    return res.redirect("/login");
  }

  const urlEntry = urlDatabase[shortURL];
  if (!urlEntry) {
    return res.status(404).send("The URL you are trying to access does not exist.");
  }

  if (urlEntry.userID !== user.id) {
    return res.status(403).send("You are not authorized to edit this URL.");
  }

  const templateVars = {
    id: shortURL,
    longURL: urlEntry.longURL,
    user: user,
  };

  return res.render("urls_show", templateVars);
});

// --- Route to implementation of short URL and HTML message to client when attempts to access a shortened URL that does not exist --- //
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];
  
  if (urlEntry) {
    const longURL = urlEntry.longURL;

    // Check if the long URL starts with http:// or https://
    if (!longURL.startsWith("http://") && !longURL.startsWith("https://")) {
      // If not, assume http:// as default
      return res.redirect(`http://${longURL}`);
    }

    // If the long URL includes www., remove it
    const cleanURL = longURL.replace("www.", "");

    return res.redirect(cleanURL);
  }

  return res.status(404).send("<html><body>Short URL not found.</body></html>");
});

// --- Renders the Login Page --- //
app.get("/login", (req, res) => {
  const user = users[req.session.userId];
  
  if (user) {
    res.redirect("/urls");
    return;
  }
  
  res.render("login", {user: user});
  
});

// --- Renders the Registration Page --- //
app.get("/register", (req, res) => {
  const user = users[req.session.userId];
  
  if (user) {
    res.redirect("/urls");
    return;
  }
  
  res.render("register", {user: user});
});

// -------------------- POST ROUTE HANDLERS -------------------- //

// --- Request to generate random URL, if not logged in, sends error, if logged in redirects to added list of user's URLs, if URL empty, send error --- //
app.post("/urls", (req, res) => {
  const user = users[req.session.userId];
  
  if (!user) {
    return res.status(401).send("You must be logged in to shorten URL.");
  }
  const longURL = req.body.longURL;

  if (!longURL) {
    return res.status(400).send("URL cannot be empty");
  }

  const shortURL = generateRandomString(6);

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user.id
  };
  res.redirect(`/urls/${shortURL}`); // Redirect to the newly created URL page
});

// --- Request to delete a created URL if the owner of the URL --- //
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const user = users[req.session.userId];

  if (!user) {
    return res.status(403).send("You need to log in to delete URLs.");
  }
  const urlEntry = urlDatabase[shortURL];
  if (!urlEntry) {
    return res.status(404).send("The URL you are trying to delete does not exist.");
  }
  if (urlEntry.userID !== user.id) {
    return res.status(403).send("You are not authorized to delete this URL.");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// --- Route to redirect client if after clicking "edit" button. If not a logged in, send error --- //
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const user = users[req.session.userId];

  if (!user) {
    return res.status(403).send("You need to log in to edit URLs.");
  }
  const urlEntry = urlDatabase[shortURL];
  if (!urlEntry) {
    return res.status(404).send("The URL you are trying to edit does not exist.");
  }
  if (urlEntry.userID !== user.id) {
    return res.status(403).send("You are not authorized to edit this URL.");
  }
  urlEntry.longURL = newLongURL;
  return res.redirect("/urls");
});

// --- Request to login, if successful login redirects client to URLs page. If failed login, status code --- //
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(404).send("Invalid email or password!");
  }
  
  req.session.userId = user.id;
  return res.redirect("/urls");
});

// --- Request to logout client and clear session cokies and redirects to login --- //
app.post("/logout", (req, res) => {

  req.session.userId = null;

  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password must be entered.");
  }

  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exists.");
  }

  const uID = generateRandomString(6);

  // --- Converts the plain-text password to a string using salt --- //
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[uID] = {
    id: uID,
    email: email,
    password: hashedPassword
  };

  req.session.userId = uID;
  res.redirect("/urls");
});

// -------------------- PORT -------------------- //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});