import { UnauthorizedError } from "@/lib/http/errors"
import { type TokenPayload, verifyToken } from "@/lib/auth/jwt"

export type AuthContext = TokenPayload

export const getAuthContext = async (req: Request): Promise<AuthContext> => {
  const header = req.headers.get("authorization")

  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token")
  }

  const token = header.slice("Bearer ".length).trim()

  if (!token) {
    throw new UnauthorizedError("Missing bearer token")
  }

  try {
    return verifyToken(token)
  } catch {
    throw new UnauthorizedError("Invalid or expired token")
  }
}
