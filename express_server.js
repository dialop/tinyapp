
//  -------------------- PORT -------------------- //

const PORT = 8080; // default port 

// -------------------- DEPENDENCIES --------------- //

const express = require("express");
const app = express();
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session"); 
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers.js");


// -------------------- MIDDLEWARE ---------------- //

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["secret_key_for_encryption"],
  maxAge: 24 * 60 * 60 * 1000
}));

// -------------------- DATA STRUCTURE --------------------- //

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// --- Registering New Users --- //
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// -------------------- GET ROUTE HANDLERS -------------------- //

app.get("/", (req, res) => {  
  res.send("Hello!");  
});

// --- Temorary JSON string representing the entire urlDatabase object --- //
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});   

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// --- Renders Main Page --- //
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];  
  if (!user) {
    res.redirect("/login");
  } else {
    const userURLs = urlsForUser(user.id);
    const templateVars = {
      user: user,
      urls: urlDatabase
    };
    res.render("urls_index", templateVars);
  }
});

// --- Renders page to create a new URL if not logged in, redirects to login page --- //
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id]; 
  if (!user) {
    res.redirect("/login");
  } else {
    
    const templateVars = {
      user: user,
    };
    res.render("urls_new", templateVars);
  }
});

// ---  Route used to display URL details, including the long URL associated with a short URL --- //
app.get("/urls/:id", (req, res) => { 
  const shortURL = req.params.id;
  const user = users[req.session.user_id];
  
  if (!user) {
    res.render("login");
  } else if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== user.id) {
    res.render("login");
  } else {
    const templateVars = {
      id: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: user,
    };
    res.render("urls_show", templateVars);
  }
});

// --- Route to implementation of short URL and HTML message to client when attempts to access a shortened URL that does not exist --- //
app.get("/u/:id", (req, res) => { 
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];
  
  if (urlEntry) {
    res.redirect(urlEntry.longURL);
  } else {
    res.status(404).send("<html><body>Short URL not found.</body></html>"); 
  }
  
});

// --- Route to identify if user is logged in and displays their URLs or redirects to the login page --- //
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];  
    
  if (!user) {
    res.render("login");      
  } else {
    const userURLs = urlsForUser(user.id);
    const templateVars = {
      user: user,
      urls: userURLs,
    };
    res.render("urls_index", templateVars);
  }
});

// --- Renders the Login Page --- //
app.get("/login", (req, res) => {   
  const user = users[req.session.user_id];
  
  if (user) {
    res.redirect("/urls");
    return;
  }
  
  res.render("login", {user: user});
  
});

// --- Renders the Registration Page --- //
app.get("/register", (req, res) => {   
  const user = users[req.session.user_id];
  
  if (user) {
    res.redirect("/urls");
    return;
  }
  
  res.render("register", {user: user});
});

// -------------------- POST ROUTE HANDLERS -------------------- //


// --- Request to generate random URL, if not logged in, sends error, if logged in sends "Ok" when URL successfully created  --- //
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id]; longURL = req.body.longURL;

  if (!user) {
    res.status(403).send("You must be logged into shorten URL.");  
  } else {
    urlDatabase[generateRandomString(6)] = {
      longURL: longURL,
      userID: user.id
    };
    console.log(req.body);
    res.send("Ok");
  }
});

// --- Request to delete a created URL if the owner of the URL --- //
app.post("/urls/:id/delete", (req, res) => {  
  const shortURL = req.params.id;
  const user = users[req.session.user_id];

  if (!user) {
    res.status(403).send("You need to log in to delete URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to delete this URL.");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// --- Route to redirect client if after clicking "edit" button. If not a logged in, send error --- //
app.post("/urls/:id", (req, res) => { 
  const shortURL = req.params.id;
  const user = users[req.session.user_id];

  if (!user) {
    res.status(403).send("You need to log in to edit URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to edit this URL.");
  } else {
    res.redirect("/urls/" + shortURL);
  }
});

// --- Request to edit the newly made URL created by the owner, if not the owner of URL send error 403 --- // 
app.post("/urls/:id/edit", (req, res) => {    
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const user = users[req.session.user_id];

  if (!user) {
    res.status(403).send("You need to log in to edit URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to edit this URL.");
  } else {
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect("/urls");
  }
});

// --- Request to login, if successful login redirects client to URLs page. If failed login, satus code 403 --- //
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(u => u.email && u.password === password);

  if (user && bcrypt.compareSync(password, user.password)) {  
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Unable to Authorize! Email or Password Invalid.");  
  }
});

// --- Request to logout client and clear session ccokies and redirects to login --- //
app.post("/logout", (req, res) => {
  req.session = null;       
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

  const userid = generateRandomString(6);

  // --- Converts the plain-text password to a string using salt --- //
  const hashedPassword = bcrypt.hashSync(password, 10); 

  users[userid] = {
    id: userid,
    email: email,
    password: hashedPassword   
  };

  req.session.user_id = userid;
  res.redirect("/urls");
});

// -------------------- PORT -------------------- //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
