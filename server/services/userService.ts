import type { User } from "@/db"
import { signToken } from "@/lib/auth/jwt"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/http/errors"
import type { LoginInput, UserRegisterInput } from "@/lib/validation/auth"
import { trainerRepo } from "@/server/repositories/trainerRepo"
import { userRepo } from "@/server/repositories/userRepo"

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const sanitizeUser = (user: User) => {
  const { passwordHash, ...publicUser } = user

  void passwordHash

  return publicUser
}

const ensureEmailAvailable = async (email: string) => {
  const [existingTrainer, existingUser] = await Promise.all([
    trainerRepo.findByEmail(email),
    userRepo.findByEmail(email),
  ])

  if (existingTrainer || existingUser) {
    throw new ConflictError("Email already in use")
  }
}

export const userService = {
  async registerUser(input: UserRegisterInput) {
    const email = normalizeEmail(input.email)
    const trainer = await trainerRepo.findById(input.trainerId)

    if (!trainer) {
      throw new ValidationError("Unknown trainerId", {
        trainerId: "Unknown trainerId",
      })
    }

    await ensureEmailAvailable(email)

    const user = await userRepo.create({
      trainerId: input.trainerId,
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name.trim(),
    })

    if (!user) {
      throw new Error("Failed to create user")
    }

    return {
      user: sanitizeUser(user),
      token: signToken({
        sub: user.id,
        role: "user",
        trainerId: user.trainerId,
      }),
    }
  },

  async loginUser(input: LoginInput) {
    const email = normalizeEmail(input.email)
    const user = await userRepo.findByEmail(email)

    if (!user) {
      throw new NotFoundError("Invalid email or password")
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash)

    if (!isValidPassword) {
      throw new NotFoundError("Invalid email or password")
    }

    return {
      user: sanitizeUser(user),
      token: signToken({
        sub: user.id,
        role: "user",
        trainerId: user.trainerId,
      }),
    }
  },
}
