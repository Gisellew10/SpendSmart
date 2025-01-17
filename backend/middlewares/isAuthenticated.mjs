const isAuthenticated = async function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized: Please log in first." });
};

export default isAuthenticated;
