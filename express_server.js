
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs") 

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

         