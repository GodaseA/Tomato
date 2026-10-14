
const verifyOrigin = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get("origin");

  // Non-browser clients may not send Origin.
  if (!origin) {
    return next();
  }

  if (origin !== process.env.CLIENT_URL) {
    return res.status(403).json({
      message: "Request origin is not allowed.",
    });
  }

  next();
};

export default verifyOrigin;
