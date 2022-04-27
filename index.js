require("dotenv").config();
const cors = require("cors");
const express = require("express");
const cookieSession = require("cookie-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
passport.serializeUser((user, done) => {
  //later use user id with db instead
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/posts"
    },
    (accessToken, refreshToken, profile, done) => {
      //in future use profile with postgres
      done(null, profile);
    }
  )
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send(`
    <h1>Authentication with google!</h1>
    <a href="/login">Sign in with google</a>
  `);
});

app.get(
  "/login",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

//route is call /courses for now bc that is what is set in cloud console
app.get(
  "/posts",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/user");
  }
);

app.get("/user", (req, res) => {
  const { user } = req;
  if (user) {
    res.send(`
      <h1> Hello ${user.displayName}</h1>
      <img src="${user.photos[0]?.value}" alt="profile picture">
      <h4>Data:</h4>
      <a href="/logout">logout</a>
      <pre>
        ${JSON.stringify(user, null, 2)}
      </pre>
    `);
  } else {
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT, () => console.log("listening on port 3000"));
