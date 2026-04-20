import type { Trainer } from "@/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { ConflictError, NotFoundError } from "@/lib/http/errors"
import type {
  LoginInput,
  TrainerRegisterInput,
} from "@/lib/validation/auth"
import { trainerRepo } from "@/server/repositories/trainerRepo"
import { userRepo } from "@/server/repositories/userRepo"

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const sanitizeTrainer = (trainer: Trainer) => {
  const { passwordHash, ...publicTrainer } = trainer

  void passwordHash

  return publicTrainer
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

export const trainerService = {
  async registerTrainer(input: TrainerRegisterInput) {
    const email = normalizeEmail(input.email)

    await ensureEmailAvailable(email)

    const trainer = await trainerRepo.create({
      email,
      passwordHash: await hashPassword(input.password),
      name: input.name.trim(),
    })

    if (!trainer) {
      throw new Error("Failed to create trainer")
    }

    return {
      trainer: sanitizeTrainer(trainer),
      token: signToken({
        sub: trainer.id,
        role: "trainer",
      }),
    }
  },

  async loginTrainer(input: LoginInput) {
    const email = normalizeEmail(input.email)
    const trainer = await trainerRepo.findByEmail(email)

    if (!trainer) {
      throw new NotFoundError("Invalid email or password")
    }

    const isValidPassword = await verifyPassword(
      input.password,
      trainer.passwordHash
    )

    if (!isValidPassword) {
      throw new NotFoundError("Invalid email or password")
    }

    return {
      trainer: sanitizeTrainer(trainer),
      token: signToken({
        sub: trainer.id,
        role: "trainer",
      }),
    }
  },

  async listTrainersPublic() {
    return trainerRepo.listPublic()
  },

  async listRoster(trainerId: string) {
    return trainerRepo.listRoster(trainerId)
  },

  async assertTrainerOwnsUser(trainerId: string, userId: string) {
    const user = await userRepo.findByIdAndTrainerId(userId, trainerId)

    if (!user) {
      throw new NotFoundError("User not found")
    }

    return user
  },
}
