import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "aarrzzaannaall";
const generateToken = (user) => {
  const payload = {
    id: user.phoneNumber,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

const fetchCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit, query = "" } = req.body;

  try {
    const customersCount = await prisma.customer.count({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { phoneNumber: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
    });

    const totalPages = Math.ceil(customersCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const customers = await prisma.customer.findMany({
      take: limit,
      skip: (currentPage - 1) * limit,
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { phoneNumber: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        email: true,
        pointsEarned: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    const formattedCustomers = customers.map((customer) => {
      const formattedCreatedAt = new Date(customer.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...customer,
        createdAt: formattedCreatedAt,
      };
    });

    res.status(200).json({
      customers: formattedCustomers,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const customerSignUp = asyncHandler(async (req, res) => {
  const {
    phoneNumber,
    email,
    username,
    password,
    street,
    house,
    entrance,
    roof,
    room,
  } = req.body;

  try {
    if (phoneNumber) {
      const phoneExists = await prisma.customer.findUnique({
        where: { phoneNumber },
      });

      if (phoneExists) {
        return res.status(400).json({
          error: "Этот номер телефона уже используется другим пользователем.",
        });
      }
    }

    if (email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          error:
            "Этот адрес электронной почты уже используется другим пользователем.",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let createdAddress = null;
    if (street && house) {
      createdAddress = await prisma.address.create({
        data: {
          street,
          house,
          entrance: entrance || null,
          roof: roof || null,
          room: room || null,
        },
      });
    }

    const customer = await prisma.customer.create({
      data: {
        phoneNumber,
        email,
        username,
        password: hashedPassword,
        addressOneId: createdAddress ? createdAddress.id : null,
      },
      include: {
        AddressOne: true,
      },
    });

    const token = generateToken(customer);
    res.status(201).json({ customer, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Произошла ошибка при обработке запроса." });
  }
});

const customerSignIn = asyncHandler(async (req, res) => {
  const { phoneNumber, email, password } = req.body;

  try {
    let customer;

    if (phoneNumber) {
      customer = await prisma.customer.findUnique({
        where: { phoneNumber: phoneNumber },
        include: {
          AddressOne: true,
          AddressTwo: true,
          AddressThree: true,
        },
      });
    }

    if (!customer && email) {
      customer = await prisma.customer.findUnique({
        where: { email: email },
        include: {
          AddressOne: true,
          AddressTwo: true,
          AddressThree: true,
        },
      });
    }

    if (!customer) {
      return res.status(401).json({
        message: "Клиент не существует.",
      });
    }

    if (!(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({
        message: "Неправильные данные. Пожалуйста повторите попытку.",
      });
    }

    delete customer.password;

    const token = generateToken(customer);

    res.status(200).json({ customer, token });
  } catch (err) {
    console.error("Error during sign-in:", err);
    res.status(500).json({ message: "Ошибка при входе в аккаунт." });
  }
});

const updateCustomerData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    phoneNumber,
    email,
    username,
    password,
    pointsEarned,
    isBlocked,
    streetOne,
    houseOne,
    entranceOne,
    roofOne,
    roomOne,
    streetTwo,
    houseTwo,
    entranceTwo,
    roofTwo,
    roomTwo,
    streetThree,
    houseThree,
    entranceThree,
    roofThree,
    roomThree,
  } = req.body;

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
      include: {
        AddressOne: true,
        AddressTwo: true,
        AddressThree: true,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    if (phoneNumber && phoneNumber !== existingCustomer.phoneNumber) {
      const phoneExists = await prisma.customer.findUnique({
        where: { phoneNumber },
      });
      if (phoneExists) {
        return res
          .status(400)
          .json({ error: "Этот номер телефона уже используется." });
      }
    }

    if (email && email !== existingCustomer.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({ error: "Этот email уже используется." });
      }
    }

    const updatedCustomerData = {
      phoneNumber: phoneNumber || existingCustomer.phoneNumber,
      email: email || existingCustomer.email,
      username: username || existingCustomer.username,
      pointsEarned:
        pointsEarned !== undefined && pointsEarned !== null
          ? Number(pointsEarned)
          : existingCustomer.pointsEarned,
      isBlocked: isBlocked,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedCustomerData.password = await bcrypt.hash(password, salt);
    }

    if (streetOne || houseOne || entranceOne || roofOne || roomOne) {
      if (existingCustomer.AddressOne) {
        const updatedAddress = await prisma.address.update({
          where: { id: existingCustomer.AddressOne.id },
          data: {
            street: streetOne || existingCustomer.AddressOne.street,
            house: houseOne || existingCustomer.AddressOne.house,
            entrance: entranceOne || existingCustomer.AddressOne.entrance,
            roof: roofOne || existingCustomer.AddressOne.roof,
            room: roomOne || existingCustomer.AddressOne.room,
          },
        });
        updatedCustomerData.addressOneId = updatedAddress.id;
      } else {
        const newAddress = await prisma.address.create({
          data: {
            street: streetOne,
            house: houseOne,
            entrance: entranceOne,
            roof: roofOne,
            room: roomOne,
          },
        });
        updatedCustomerData.addressOneId = newAddress.id;
      }
    }

    if (streetTwo || houseTwo || entranceTwo || roofTwo || roomTwo) {
      if (existingCustomer.AddressTwo) {
        const updatedAddress = await prisma.address.update({
          where: { id: existingCustomer.AddressTwo.id },
          data: {
            street: streetTwo || existingCustomer.AddressTwo.street,
            house: houseTwo || existingCustomer.AddressTwo.house,
            entrance: entranceTwo || existingCustomer.AddressTwo.entrance,
            roof: roofTwo || existingCustomer.AddressTwo.roof,
            room: roomTwo || existingCustomer.AddressTwo.room,
          },
        });
        updatedCustomerData.addressTwoId = updatedAddress.id;
      } else {
        const newAddress = await prisma.address.create({
          data: {
            street: streetTwo,
            house: houseTwo,
            entrance: entranceTwo,
            roof: roofTwo,
            room: roomTwo,
          },
        });
        updatedCustomerData.addressTwoId = newAddress.id;
      }
    }

    if (streetThree || houseThree || entranceThree || roofThree || roomThree) {
      if (existingCustomer.AddressThree) {
        const updatedAddress = await prisma.address.update({
          where: { id: existingCustomer.AddressThree.id },
          data: {
            street: streetThree || existingCustomer.AddressThree.street,
            house: houseThree || existingCustomer.AddressThree.house,
            entrance: entranceThree || existingCustomer.AddressThree.entrance,
            roof: roofThree || existingCustomer.AddressThree.roof,
            room: roomThree || existingCustomer.AddressThree.room,
          },
        });
        updatedCustomerData.addressThreeId = updatedAddress.id;
      } else {
        const newAddress = await prisma.address.create({
          data: {
            street: streetThree,
            house: houseThree,
            entrance: entranceThree,
            roof: roofThree,
            room: roomThree,
          },
        });
        updatedCustomerData.addressThreeId = newAddress.id;
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updatedCustomerData,
      include: {
        AddressOne: true,
        AddressTwo: true,
        AddressThree: true,
      },
    });

    const token = generateToken(customer);
    res.status(200).json({ customer, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при обновлении данных." });
  }
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.customer.delete({
      where: { id: id },
    });
    return user
      ? res.json({ message: "Клиентудален." })
      : res.status(404).json({ message: "Клиентне найден." });
  } catch (err) {
    res.status(500).send("Ошибка при удалении пользователя.");
  }
});

const deleteAllCustomers = asyncHandler(async (req, res) => {
  try {
    const clients = await prisma.customer.deleteMany();

    return clients
      ? res.json({ message: "Все пользователи удалены." })
      : res.status(404).json({ message: "Пользователи не найдены." });
  } catch (err) {
    res.status(500).send({ err });
  }
});

const fetchCustomerInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        AddressOne: true,
        AddressTwo: true,
        AddressThree: true,
        ProductReviews: true,
        MarketReview: true,
        Orders: {
          include: {
            OrderStatus: true,
            OrderCity: true,
            OrderTime: true,
            DeliveryType: true,
            PaymentType: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    const formattedCreatedAt = new Date(customer.createdAt).toLocaleString(
      "en-GB",
      timeFormat
    );

    const formattedCustomer = {
      ...customer,
      createdAt: formattedCreatedAt,
    };

    res.status(200).json(formattedCustomer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const fetchPoints = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        pointsEarned: true,
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    const formattedCustomer = {
      ...customer,
    };

    res.status(200).json(formattedCustomer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const fetchUnRegCustomerInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await prisma.unRegisteredCustomer.findUnique({
      where: { id: Number(id) },
      include: {
        Orders: {
          include: {
            OrderStatus: true,
            OrderCity: true,
            OrderTime: true,
            DeliveryType: true,
            PaymentType: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Пользователь не найден." });
    }

    const formattedCreatedAt = new Date(customer.createdAt).toLocaleString(
      "en-GB",
      timeFormat
    );

    const formattedCustomer = {
      ...customer,
      createdAt: formattedCreatedAt,
    };

    res.status(200).json(formattedCustomer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const blockCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { isBlocked } = req.body;

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Клиент не найден." });
    }

    await prisma.customer.update({
      where: { id },
      data: {
        isBlocked: isBlocked,
      },
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при блокировке клиента." });
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { userIsBlocked } = req.body;

  try {
    const existingUnreguser = await prisma.unRegisteredCustomer.findUnique({
      where: { id: Number(id) },
    });

    if (!existingUnreguser) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    await prisma.unRegisteredCustomer.update({
      where: { id: Number(id) },
      data: {
        userIsBlocked: userIsBlocked,
      },
    });

    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при блокировке пользователья." });
  }
});

router.post("/all", fetchCustomers);
router.post("/signup", customerSignUp);
router.post("/signin", customerSignIn);
router.patch("/update/:id", updateCustomerData);
router.patch("/block/:id", blockCustomer);
router.patch("/userblock/:id", blockUser);
router.delete("/delete/:id", deleteCustomer);
router.delete("/deleteall/", deleteAllCustomers);
router.get("/points/fetch/:id", fetchPoints);
router.get("/fetch/:id", fetchCustomerInfo);
router.get("/unreg/:id", fetchUnRegCustomerInfo);

export default router;
