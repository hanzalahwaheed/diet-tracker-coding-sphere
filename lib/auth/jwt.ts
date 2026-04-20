import jwt from "jsonwebtoken"

export type AuthRole = "trainer" | "user"

export type TokenPayload = {
  sub: string
  role: AuthRole
  trainerId?: string
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set")
  }

  return secret
}

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "7d",
  })

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  })

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    (decoded.role !== "trainer" && decoded.role !== "user")
  ) {
    throw new Error("Invalid token payload")
  }

  if (
    decoded.trainerId !== undefined &&
    typeof decoded.trainerId !== "string"
  ) {
    throw new Error("Invalid trainerId in token payload")
  }

  return {
    sub: decoded.sub,
    role: decoded.role,
    trainerId: decoded.trainerId,
  }
}
