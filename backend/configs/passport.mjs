import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { compare } from "bcrypt";
import User from "../models/User.mjs";

passport.use(
  new LocalStrategy(async (email, password, done) => {
    const user = await User.findOne({ email });

    if (!user || user.type !== "Native") {
      return done(null, false, {
        message: "User not found or not registered as native account.",
      });
    }

    const isMatch = compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: "Invalid credentials." });
    }
    return done(null, user);
  }),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      const email = profile.emails && profile.emails[0]?.value;
      if (!email) {
        return done(new Error("Email not available in Google profile"), null);
      }

      // Check if the user exists in the database
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          email,
          name: profile.displayName || "Google User",
          type: "Google",
        });
      } else if (user.type !== "Google") {
        return done(new Error("User not registered as Google account."), null);
      }
      await user.save();

      return done(null, user);
    },
  ),
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((_id, done) => {
  const userFound = User.findById(_id);
  done(null, userFound);
});

const passportConfig = {
  initialize: () => passport.initialize(),
  session: () => passport.session(),
  authenticate: (strategy, options) => passport.authenticate(strategy, options),
};

export default passportConfig;
