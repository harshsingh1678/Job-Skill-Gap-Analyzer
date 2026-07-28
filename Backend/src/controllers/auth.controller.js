const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */

async function registerUserController(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide username, email and password",
    });
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "Account already exists with this email address or username",
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    username,
    email,
    password: hash,
  });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", token);

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */

async function loginUserController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  if (!user.password) {
    return res.status(400).json({
      message: "This account uses Google Sign-In. Please continue with Google instead.",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", token);
  res.status(200).json({
    message: "User loggedIn successfully.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */

async function logoutUserController(req, res) {

  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        message: "Please login first.",
      });
    }

    await tokenBlacklistModel.create({ token });

    res.clearCookie("token");

    res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      message: "Error logging out",
      error: error.message,
    });
  }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */

async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id);

  res.status(200).json({
    message: "User details fetched successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

/**
 * @name generateUniqueUsername
 * @description derive an available, unique username from a Google display name/email
 */

async function generateUniqueUsername(base) {
  const cleanBase = (base || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
  let candidate = cleanBase;

  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await userModel.findOne({ username: candidate });
    if (!exists) return candidate;
    candidate = `${cleanBase}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return `${cleanBase}${Date.now()}`;
}


/**
 * @name googleAuthController
 * @description login or register a user using a Google Sign-In ID token, expects "credential" in the request body
 * @access Public
 */

async function googleAuthController(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email_verified) {
      return res.status(401).json({
        message: "Google account email is not verified.",
      });
    }

    const { sub: googleId, email, name } = payload;

    let user = await userModel.findOne({ googleId });

    if (!user) {
      user = await userModel.findOne({ email });

      if (user) {
        // Existing email/password account signing in with Google for the first time — link it.
        user.googleId = googleId;
        await user.save();
      } else {
        const username = await generateUniqueUsername(name || email.split("@")[0]);
        user = await userModel.create({
          username,
          email,
          googleId,
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token);

    res.status(200).json({
      message: "Logged in with Google successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(401).json({
      message: "Google authentication failed.",
    });
  }
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController, googleAuthController };