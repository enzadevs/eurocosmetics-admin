import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "eeuurrooccoossmmeettiiccss";
const generateToken = (user) => {
  const payload = {
    id: user.phoneNumber,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "6h" });
};

const userSignUp = asyncHandler(async (req, res) => {
  const { phoneNumber, username, password, role } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const existingUser = await prisma.user.findFirst({
      where: { phoneNumber: phoneNumber },
    });

    if (existingUser) {
      return res.status(409).json({
        message:
          "Этот номер уже используется. Пожалуйста, попробуйте с другим номером.",
      });
    }

    const user = await prisma.user.create({
      data: {
        phoneNumber: phoneNumber,
        username,
        password: hashedPassword,
        Role: role,
      },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
      },
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при регистрации." });
  }
});

const userSignIn = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        Role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Пользователья не существует.",
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Неправильные данные. Пожалуйста повторите попытку.",
      });
    }

    if (user.Role === "ADMIN") {
      delete user.password;
      const token = generateToken(user);
      res.status(200).json({ user, token });
    } else if (user.Role === "MANAGER" || user.Role === "CASHIER") {
      delete user.password;
      const token = generateToken(user);
      res.status(200).json({ user, token });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при входе.");
  }
});

const updateUserData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phoneNumber, username, password, role } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = password ? await bcrypt.hash(password, salt) : null;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    if (phoneNumber && phoneNumber !== existingUser.phoneNumber) {
      const phoneExists = await prisma.user.findUnique({
        where: { phoneNumber },
      });

      if (phoneExists) {
        return res.status(400).json({
          error: "Этот номер телефона уже используется другим пользователем.",
        });
      }
    }

    if (username && username !== existingUser.username) {
      const userNameExists = await prisma.user.findUnique({
        where: { username },
      });

      if (userNameExists) {
        return res.status(400).json({
          error: "Это имя уже используется другим пользователем.",
        });
      }
    }

    const updatedUserData = {
      phoneNumber: phoneNumber !== "" ? phoneNumber : existingUser.phoneNumber,
      username: username || existingUser.username,
      password: hashedPassword || existingUser.password,
      role: role || existingUser.Role,
    };

    const user = await prisma.user.update({
      where: { id },
      data: updatedUserData,
    });

    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении данных.");
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.delete({
      where: { id: id },
    });
    return user
      ? res.json({ message: "Пользователь удален." })
      : res.status(404).json({ message: "Пользователь не найден." });
  } catch (err) {
    res.status(500).send({ err });
  }
});

const fetchUsers = asyncHandler(async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    const formattedUsers = users.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toLocaleString("en-GB", timeFormat),
      updatedAt: new Date(item.updatedAt).toLocaleString("en-GB", timeFormat),
    }));

    res.status(200).json({ users: formattedUsers });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка.");
  }
});

router.get("/fetch", fetchUsers);
router.post("/signup", userSignUp);
router.post("/signin", userSignIn);
router.patch("/update/:id", updateUserData);
router.delete("/delete/:id", deleteUser);

export default router;
