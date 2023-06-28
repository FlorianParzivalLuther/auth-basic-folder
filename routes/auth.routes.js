// // routes/auth.routes.js

// const router = require("express").Router();
// const bcryptjs = require("bcryptjs");
// const saltRounds = 10;
// const User = require("../models/User.model");
// const mongoose = require("mongoose"); // <== has to be added

// // GET route ==> to display the signup form to users
// router.get("/signup", (req, res) => res.render("auth/signup"));

// // POST route ==> to process form data
// router.post("/signup", (req, res, next) => {
//   const { username, email, password } = req.body;

//   // make sure users fill all mandatory fields:
//   if (!username || !email || !password) {
//     res.render("auth/signup", {
//       errorMessage:
//         "All fields are mandatory. Please provide your username, email and password.",
//     });
//     return;
//   }
//   const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
//   if (!regex.test(password)) {
//     res.status(500).render("auth/signup", {
//       errorMessage:
//         "Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.",
//     });
//     return;
//   }

//   bcryptjs
//     .genSalt(saltRounds)
//     .then((salt) => bcryptjs.hash(password, salt))
//     .then((hashedPassword) => {
//       return User.create({
//         // username: username
//         username,
//         email,
//         // passwordHash => this is the key from the User model
//         //     ^
//         //     |            |--> this is placeholder (how we named returning value from the previous method (.hash()))
//         passwordHash: hashedPassword,
//       });
//     })
//     .then((userFromDB) => {
//       console.log("Newly created user is: ", userFromDB);
//       res.redirect("/userProfile");
//     })
//     .catch((error) => {
//       if (error instanceof mongoose.Error.ValidationError) {
//         res.status(500).render("auth/signup", { errorMessage: error.message });
//       } else if (error.code === 11000) {
//         console.log(
//           " Username and email need to be unique. Either username or email is already used. "
//         );

//         res.status(500).render("auth/signup", {
//           errorMessage: "User not found and/or incorrect password.",
//         });
//       } else {
//         next(error);
//       }
//     });
// });

// //router GET
// router.get("/userProfile", (req, res) => res.render("users/user-profile"));

// module.exports = router;

const router = require("express").Router();
const bcryptjs = require("bcryptjs");
const saltRounds = 10;
const User = require("../models/User.model");
const mongoose = require("mongoose");

// GET route ==> to display the signup form to users
router.get("/signup", (req, res) => res.render("auth/signup"));

// POST route ==> to process form data
router.post("/signup", (req, res, next) => {
  const { username, email, password } = req.body;

  // Make sure users fill all mandatory fields
  if (!username || !email || !password) {
    res.render("auth/signup", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email, and password.",
    });
    return;
  }

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("auth/signup", {
      errorMessage:
        "Password needs to have at least 6 characters and must contain at least one number, one lowercase, and one uppercase letter.",
    });
    return;
  }

  // Check if email or username already exist in the database
  User.findOne({ $or: [{ email }, { username }] })
    .then((existingUser) => {
      if (existingUser) {
        const errorMessage =
          existingUser.email === email
            ? "Email is already registered."
            : "Username is already taken.";

        res.status(500).render("auth/signup", { errorMessage });
        return;
      }

      return bcryptjs.genSalt(saltRounds);
    })
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return User.create({
        username,
        email,
        passwordHash: hashedPassword,
      });
    })
    .then((userFromDB) => {
      console.log("Newly created user is: ", userFromDB);
      res.redirect("/userProfile");
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render("auth/signup", { errorMessage: error.message });
      } else {
        next(error);
      }
    });
});

// GET route
router.get("/userProfile", (req, res) => res.render("users/user-profile"));

// routes/auth.routes.js
// ... imports and both signup routes stay untouched

//////////// L O G I N ///////////

// GET route ==> to display the login form to users
router.get("/login", (req, res) => res.render("auth/login"));

// userProfile route and the module export stay unchanged
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Please enter both, email and password to login.",
    });
    return;
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        console.log("Email not registered. ");
        res.render("auth/login", {
          errorMessage: "User not found and/or incorrect password.",
        });
        return;
      } else if (bcryptjs.compareSync(password, user.passwordHash)) {
        res.render("users/user-profile", { user });
      } else {
        console.log("Incorrect password. ");
        res.render("auth/login", {
          errorMessage: "User not found and/or incorrect password.",
        });
      }
    })
    .catch((error) => next(error));
});

module.exports = router;
