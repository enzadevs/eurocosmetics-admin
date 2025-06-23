import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();
const multerStorage = multer;
const storage = multer.memoryStorage();
const upload = multerStorage({ storage: storage });

const optimizeAndSaveImage = async (buffer, filename, mimetype) => {
  const optimizedImagePath = path.join("uploads/products/", filename);
  let sharpInstance = sharp(buffer, { failOnError: false }).resize(2000);

  if (mimetype === "image/png") {
    sharpInstance = sharpInstance.png({ quality: 100 });
  } else if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    sharpInstance = sharpInstance.jpeg({ quality: 100 });
  } else {
    const format = mimetype.split("/")[1] || "jpeg";
    sharpInstance = sharpInstance.toFormat(format);
  }

  await sharpInstance.toFile(optimizedImagePath);
  return optimizedImagePath;
};

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
    let image = null;

    if (req.file) {
      const fileExtension = path.extname(req.file.originalname);
      const filename = `${Date.now()}${fileExtension}`;
      image = await optimizeAndSaveImage(
        req.file.buffer,
        filename,
        req.file.mimetype
      );
    }

    await prisma.productStatus.create({
      data: { nameTm, nameRu, image: image },
    });

    res.status(201).json({ message: "Статус создан." });
  } catch (err) {
    res.status(500).send("Ошибка при создании статуса.");
  }
});

const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu } = req.body;

  const existingStatus = await prisma.productStatus.findUnique({
    where: { id: Number(id) },
  });

  if (!existingStatus) {
    return res.status(404).json({ message: "Статус не найдена." });
  }

  let image = null;

  if (req.file) {
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${Date.now()}${fileExtension}`;
    image = await optimizeAndSaveImage(
      req.file.buffer,
      filename,
      req.file.mimetype
    );
  }

  try {
    await prisma.productStatus.update({
      where: { id: Number(id) },
      data: { nameTm, nameRu, image: image },
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
router.post("/new/", upload.single("image"), newStatus);
router.patch("/update/:id", upload.single("image"), updateStatus);
router.delete("/delete/:id", deleteStatus);

export default router;
