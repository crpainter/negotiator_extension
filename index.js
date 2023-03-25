const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
//const GoogleStrategy = require("passport-google-oauth20").Strategy;
//const User = require("./user");
const Negotiation = require("./negotiation");
const { google } = require("googleapis");
const dotenv = require("dotenv");

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log(err));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      } else {
        user = new User({
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          accessToken: accessToken,
          refreshToken: refreshToken,
        });

        await user.save();
        return done(null, user);
      }
    } catch (err) {
      console.log(err);
      return done(err, null);
    }
  }
));

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: [
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.modify",
  ],
}));

app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => res.send("Home"));
app.get("/dashboard", ensureAuthenticated, async (req, res) => {
  // Your dashboard code here
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// API routes
app.post("/api/negotiations", ensureAuthenticated, async (req, res) => {
  // Endpoint for creating negotiations
});

app.get("/api/negotiations", ensureAuthenticated, async (req, res) => {
  // Endpoint for getting a list of user's negotiations
});

app.get("/api/negotiations/:id", ensureAuthenticated, async (req, res) => {
  // Endpoint for getting a single negotiation by ID
});

app.put("/api/negotiations/:id", ensureAuthenticated, async (req, res) => {
  // Endpoint for updating a negotiation by ID
});