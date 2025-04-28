import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const fetchForAdmin = asyncHandler(async (req, res) => {
  try {
    const deliveryTypes = await prisma.deliveryType.findMany();

    res.status(200).json({ deliveryTypes: deliveryTypes });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchForClient = asyncHandler(async (req, res) => {
  try {
    const deliveryTypes = await prisma.deliveryType.findMany({
      where: { isActive: true },
    });

    res.status(200).json({ deliveryTypes: deliveryTypes });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newDeliveryType = asyncHandler(async (req, res) => {
  const { nameTm, nameRu, isActive } = req.body;

  try {
    await prisma.deliveryType.create({
      data: { nameTm, nameRu, isActive: JSON.parse(isActive) },
    });

    res.status(201).json({ message: "Способ доставки создано." });
  } catch (err) {
    res.status(500).send("Ошибка при создании способа доставки.");
  }
});

const updateDeliveryType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu, isActive } = req.body;

  try {
    await prisma.deliveryType.update({
      where: { id: Number(id) },
      data: {
        nameTm,
        nameRu,
        isActive: JSON.parse(isActive),
      },
    });
    res.status(201).json({ message: "Способ доставки обновлен." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении способа доставки.");
  }
});

const deleteDeliveryType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.deliveryType.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Способ доставки удален." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(409).json({
        message: "Способ доставки не найден.",
      });
    } else {
      res.status(500).send("Ошибка при удалении способа доставки.");
    }
  }
});

router.get("/fetch/admin", fetchForAdmin);
router.get("/fetch/client", fetchForClient);
router.post("/new", newDeliveryType);
router.patch("/update/:id", updateDeliveryType);
router.delete("/delete/:id", deleteDeliveryType);

export default router;
