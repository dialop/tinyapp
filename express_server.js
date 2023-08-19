
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
    
  }
  return result;
}



//Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {    // code to implement a DELETE operation to remove existing shortened URLs
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {         // implementing the redirect link after using "edit" button on localhost:8080/urls/
  const shortURL = req.params.id;
  res.redirect("/urls/" + shortURL);
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  res.redirect("/urls"); // Redirect back to the URLs index page
});

app.post("/login", (req, res) => {
  const { username } = req.body;            // implementing cookie username
  res.cookie('username', username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {        // clear username cookie
  res.clearCookie('username');
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
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {        // display the username, the short URL ID, and the associated long URL
  const templateVars = {
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {              //code to implement short URL
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.statusCode(404).send("Short URL not found");
  }

});

app.get("/urls", (req, res) => {                  // rendering the "urls_index" template for the the username of the currently logged in user
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_index", templateVars);
});

