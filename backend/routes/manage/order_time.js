import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const fetchAll = asyncHandler(async (req, res) => {
  try {
    const orderTimes = await prisma.orderTime.findMany({
      orderBy: { id: "asc" },
    });

    res.status(200).json({ orderTimes: orderTimes });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchForClient = asyncHandler(async (req, res) => {
  try {
    const orderTimes = await prisma.orderTime.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    res.status(200).json({ orderTimes: orderTimes });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newOrderTime = asyncHandler(async (req, res) => {
  const { nameTm, nameRu, time, limit, isActive } = req.body;

  try {
    await prisma.orderTime.create({
      data: {
        nameTm,
        nameRu,
        time,
        limit: Number(limit),
        isActive: JSON.parse(isActive),
      },
    });

    res.status(201).json({ message: "Время доставки создано." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании времени доставки.");
  }
});

const updateOrderTime = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu, time, limit, isActive } = req.body;

  try {
    await prisma.orderTime.update({
      where: { id: Number(id) },
      data: {
        nameTm,
        nameRu,
        time,
        limit: Number(limit),
        isActive: JSON.parse(isActive),
      },
    });
    res.status(201).json({ message: "Время доставки обновлена." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении времени доставки.");
  }
});

const deleteOrderTime = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.orderTime.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Время доставки удалено." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(409).json({
        message: "Время доставки не найдено.",
      });
    } else {
      res.status(500).send("Ошибка при удалении времени доставки.");
    }
  }
});

router.get("/fetch/all", fetchAll);
router.get("/fetch/client", fetchForClient);
router.post("/new/", newOrderTime);
router.patch("/update/:id", updateOrderTime);
router.delete("/delete/:id", deleteOrderTime);

export default router;
