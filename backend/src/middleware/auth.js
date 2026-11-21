import jwt from "jsonwebtoken";
export function auth(req, _res, next) {
  const token =
    req.cookies?.fintrack_token ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token)
    return next(
      Object.assign(new Error("Authentication required"), { status: 401 }),
    );
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    next(
      Object.assign(new Error("Session expired. Please sign in again."), {
        status: 401,
      }),
    );
  }
}
export const issueCookie = (res, userId, remember = true) => {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: remember ? "30d" : "1d",
  });
  res.cookie("fintrack_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: remember ? 30 * 86400000 : 86400000,
  });
};
