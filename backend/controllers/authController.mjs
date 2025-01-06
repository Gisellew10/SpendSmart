import User from "../models/User.mjs";
import { genSalt, hash, compare } from "bcrypt";
import passportConfig from "../configs/passport.mjs";

const SALT_ROUNDS = 10;
const TYPES = ["Native", "Google"];

export const createUser = async (req, res) => {
  try {
    const { email, name, password, age, type } = req.body;

    if (!type || !TYPES.includes(type)) {
      return res.status(400).json({ message: "Valid type is required." });
    }

    if (type === "Native") {
      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(400).json({ message: "User already exists." });
      }

      const salt = await genSalt(SALT_ROUNDS);
      const passwordHash = await hash(password, salt);
      const user = new User({
        email,
        name,
        password: passwordHash,
        type,
        age,
      });
      await user.save();
      res.status(201).json({ message: "User created successfully.", user });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    } else {
      console.error("Error after headers sent:", error);
    }
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, type } = req.body;

    if (!type || !TYPES.includes(type)) {
      return res.status(400).json({ message: "Valid type is required." });
    }

    if (type === "Native") {
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "All required fields must be filled." });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const isMatch = await compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid credentials for user." });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.status(200).json({ message: "Login successful.", user });
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  req.logout(function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to logout." });
    }
    res.status(200).json({ message: "Logout successful." });
  });
};

export const getUser = async (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({ user: req.session.passport.user });
  }
  res.status(200).json({ message: "User not logged in." });
};

export const loginUserGoogle = (req, res, next) => {
  passportConfig.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
};

export const loginUserGoogleCallback = (req, res, next) => {
  passportConfig.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}`,
    successRedirect: `${process.env.FRONTEND_URL}`,
  })(req, res, next);
};
