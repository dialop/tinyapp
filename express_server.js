
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const e = require("express");

app.set("view engine", "ejs");

// urlDatabase
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


// Registering New Users
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

const generateRandomString = function(length) {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

//Error Email Condition
const getUserByEmail = function(email) {
  return Object.values(users).find(user => user.email === email);
};

// urlsForUser Functiom
const urlsForUser = function(id) {
  const userURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};



//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const longURL = req.body.longURL;

  if (!user) {
    res.status(403).send("You must be logged into shorten URL.");  //repond with HTML message with code status restriction
  } else {
    urlDatabase[generateRandomString(6)] = {
      longURL: longURL,
      userID: user.id
    };
    console.log(req.body);
    res.send("Ok");
  }
});

app.post("/urls/:id/delete", (req, res) => {  // code to implement a DELETE operation to remove existing shortened URLs
  const shortURL = req.params.id;
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.status(403).send("You need to log in to delete URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to delete this URL.");
  } else {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => { // implementing the redirect link after using "edit" button on localhost:8080/urls/
  const shortURL = req.params.id;
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.status(403).send("You need to log in to edit URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to edit this URL.");
  } else {
    res.redirect("/urls/" + shortURL);
  }
});

app.post("/urls/:id/edit", (req, res) => {    //implementing the post edit
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.status(403).send("You need to log in to edit URLs.");
  } else if (urlDatabase[shortURL].userID !== user.id) {
    res.status(403).send("You are not authorized to edit this URL.");
  } else {
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body; // implementing cookie user_id
  const user = Object.values(users).find(u => u.email && u.password === password);

  if (user) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Cannot Authorize Request Email or Password Invalid.");
  }
});

app.post("/logout", (req, res) => { // clear user_id cookie
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password must be entered.");
  }

  if (getUserByEmail(email)) {
    res.status(400).send("Email already exists.");
  }

  const userid = generateRandomString(6);
  users[userid] = {
    id: userid,
    email: email,
    password: password
  };

  res.cookie("user_id", userid);
  res.redirect("/urls");
});




// Routes
app.get("/", (req, res) => {  //registers a handler on the root path, "/".
  res.send("Hello!");   //This shows up when you go to " http://localhost:8080/"
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});     // when run on "http://localhost:8080/urls.json", we see JSON string representing the entire urlDatabase object

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
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

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]]; //redirecting unautheenticated users
  if (!user) {
    res.redirect("/login");
  } else {

    const templateVars = {
      user: user,
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => { // display the username, the short URL ID, and the associated long URL
  const shortURL = req.params.id;
  const user = users[req.cookies["user_id"]];

  if (!user) {
    res.render("login");
  } else if (!urlDatabase[shortURL] || urlDatabase[shortURL].userID !== user.id) {
    res.render("login");                                                                // *******
  } else {
    const templateVars = {
      id: shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: user,
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:id", (req, res) => { //code to implement short URL
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];

  if (urlEntry) {
    res.redirect(urlEntry.longURL);
  } else {
    res.statusCode(404).send("<html><body>Short URL not found.</body></html>"); // HTML message to client when attempts to access a shortened URL that does not exist
  }
  
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];  // rendering the "urls_index" template for the the username of the currently logged in user
    
  if (!user) {
    res.render("login");      //display urls for logged in users only
  } else {
    const userURLs = urlsForUser(user.id);
    const templateVars = {
      user: user,
      urls: userURLs,
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/register", (req, res) => { //route for register endpoint to render register.ejs tempelate
  res.render("register", { user: req.cookies.user_id });
});

app.get("/login", (req, res) => {
  res.render("login", { user: req.cookies.user_id });  //route for /login enspoint to render login.ejs tempelate
});

app.get("/login", (req, res) => {   //redirecting when user logged in
  const user = users[req.cookies["user_id"]];

  if (user) {
    res.redirect("/urls");
    return;
  }

  res.render("login", {user: user});
  
});

app.get("/register", (req, res) => {   //rendering registration page
  const user = users[req.cookies["user_id"]];

  if (user) {
    res.redirect("/urls");
    return;
  }

  res.render("login", {user: user});
});


