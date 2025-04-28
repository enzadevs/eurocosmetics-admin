import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const fetchAll = asyncHandler(async (req, res) => {
  try {
    const productStatuses = await prisma.productStatus.findMany();

    res.status(200).json({ productStatuses: productStatuses });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newStatus = asyncHandler(async (req, res) => {
  const { nameTm, nameRu } = req.body;

  try {
    await prisma.productStatus.create({
      data: { nameTm, nameRu },
    });

    res.status(201).json({ message: "Статус создан." });
  } catch (err) {
    res.status(500).send("Ошибка при создании статуса.");
  }
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu } = req.body;

  try {
    await prisma.productStatus.update({
      where: { id: Number(id) },
      data: { nameTm, nameRu },
    });
    res.status(201).json({ message: "Статус обновлен." });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении статуса.");
  }
});

const deleteStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.productStatus.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Статус удален." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(409).json({
        message: "Статус не найден.",
      });
    } else {
      res.status(500).send("Ошибка при удалении статуса.");
    }
  }
});

router.get("/fetch/all", fetchAll);
router.post("/new/", newStatus);
router.patch("/update/:id", updateStatus);
router.delete("/delete/:id", deleteStatus);

export default router;
