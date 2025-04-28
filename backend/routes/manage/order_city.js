import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const fetchForAdmin = asyncHandler(async (req, res) => {
  try {
    const orderCities = await prisma.orderCity.findMany();

    res.status(200).json({ orderCities: orderCities });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchForClient = asyncHandler(async (req, res) => {
  try {
    const orderCities = await prisma.orderCity.findMany({
      where: { isActive: true },
    });

    res.status(200).json({ orderCities: orderCities });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newOrderCity = asyncHandler(async (req, res) => {
  const { nameTm, nameRu, price, isActive } = req.body;

  try {
    await prisma.orderCity.create({
      data: {
        nameTm,
        nameRu,
        price: Number(price),
        isActive: JSON.parse(isActive),
      },
    });

    res.status(201).json({ message: "Место доставки создано." });
  } catch (err) {
    res.status(500).send("Ошибка при создании места доставки.");
  }
});

const updateOrderCity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu, price, isActive } = req.body;

  try {
    await prisma.orderCity.update({
      where: { id: Number(id) },
      data: {
        nameTm,
        nameRu,
        price: Number(price),
        isActive: JSON.parse(isActive),
      },
    });
    res.status(201).json({ message: "Место доставки обновлен." });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении места доставки.");
  }
});

const deleteOrderCity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.orderCity.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Место доставки удален." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(409).json({
        message: "Место доставки не найден.",
      });
    } else {
      res.status(500).send("Ошибка при удалении места доставки.");
    }
  }
});

router.get("/fetch/admin", fetchForAdmin);
router.get("/fetch/client", fetchForClient);
router.post("/new", newOrderCity);
router.patch("/update/:id", updateOrderCity);
router.delete("/delete/:id", deleteOrderCity);

export default router;
