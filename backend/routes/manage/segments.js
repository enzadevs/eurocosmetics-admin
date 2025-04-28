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
  const optimizedImagePath = path.join("uploads/segments/", filename);
  let sharpInstance = sharp(buffer, { failOnError: false }).resize(300);

  if (mimetype === "image/png") {
    sharpInstance = sharpInstance.png({ quality: 98 });
  } else if (mimetype === "image/jpeg" || mimetype === "image/jpg") {
    sharpInstance = sharpInstance.jpeg({ quality: 98 });
  } else {
    sharpInstance = sharpInstance.toFormat(sharp.format.from(mimetype));
  }

  await sharpInstance.toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchAll = asyncHandler(async (req, res) => {
  try {
    const segments = await prisma.segment.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        nameRu: true,
        nameTm: true,
        order: true,
        image: true,
        isActive: true,
        SubCategory: {
          select: {
            nameRu: true,
          },
        },
      },
    });

    res.status(200).json({ segments: segments });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchSegments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ nameRu: { contains: query, mode: "insensitive" } }],
        }
      : {};

    const segmentCount = await prisma.segment.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(segmentCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const segments = await prisma.segment.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: { order: "asc" },
      include: {
        SubCategory: {
          select: {
            nameRu: true,
          },
        },
      },
    });

    res.status(200).json({
      segments: segments,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchSegmentsClient = asyncHandler(async (req, res) => {
  try {
    const segments = await prisma.segment.findMany({
      where: {
        isActive: true,
        Products: {
          some: {
            isActive: true,
            stock: { gt: 0 },
            currentSellPrice: { gt: 0 },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        nameRu: true,
        nameTm: true,
        order: true,
        image: true,
        SubCategory: {
          select: {
            nameTm: true,
            nameRu: true,
          },
        },
      },
    });

    res.status(200).json({ segments: segments });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const segment = await prisma.segment.findUnique({
      where: { id },
      include: {
        SubCategory: true,
      },
    });

    return segment
      ? res.status(200).send(segment)
      : res.status(404).json({ message: "Сегмент не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const segment = await prisma.segment.findUnique({
      where: {
        id,
        isActive: true,
        Products: {
          some: {
            isActive: true,
            stock: { gt: 0 },
            currentSellPrice: { gt: 0 },
          },
        },
      },
      include: {
        SubCategory: {
          select: {
            nameTm: true,
            nameRu: true,
          },
        },
      },
    });

    return segment
      ? res.status(200).send(segment)
      : res.status(404).json({ message: "Сегмент не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newSegment = asyncHandler(async (req, res) => {
  const {
    nameTm,
    nameRu,
    order,
    isActive,
    discountType,
    discountValue,
    subCategoryId,
  } = req.body;

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
    await prisma.segment.create({
      data: {
        nameTm,
        nameRu,
        order: Number(order),
        discountType,
        discountValue: Number(discountValue),
        isActive: JSON.parse(isActive),
        image: image || "",
        SubCategory: {
          connect: {
            id: subCategoryId,
          },
        },
      },
    });

    res.status(201).json({ message: "Сегмент создан." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании под сегмента.");
  }
});

const updateSegment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameTm,
    nameRu,
    order,
    isActive,
    discountType,
    discountValue,
    subCategoryId,
  } = req.body;

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
    const existingSegment = await prisma.segment.findUnique({
      where: { id },
    });

    if (!existingSegment) {
      return res.status(404).json({ message: "Сегмент не найден." });
    }

    const updatedSegmentData = {
      nameTm: nameTm || existingSegment.nameTm,
      nameRu: nameRu || existingSegment.nameRu,
      order: Number(order) || existingSegment.order,
      discountType: discountType || existingSegment.discountType,
      discountValue: Number(discountValue) || existingSegment.discountValue,
      isActive: JSON.parse(isActive),
      image: image || existingSegment.image,
      SubCategory: {
        connect: { id: subCategoryId || existingSegment.subCategoryId },
      },
    };

    await prisma.segment.update({
      where: { id },
      data: updatedSegmentData,
    });

    await prisma.product.updateMany({
      where: { segmentId: id },
      data: { isActive: JSON.parse(isActive) },
    });

    res.status(201).json({ message: "Сегмент обновлен." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении сегмента.");
  }
});

const deleteSegment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.segment.delete({
      where: { id },
    });

    res.status(200).json({ message: "Сегмент удалена." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(409).json({
        message: "Сегмент не найдена.",
      });
    } else {
      res.status(500).send("Ошибка при удалении под сегмента.");
    }
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchSegments);
router.get("/fetch/client", fetchSegmentsClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post("/new/", upload.single("image"), newSegment);
router.patch("/update/:id", upload.single("image"), updateSegment);
router.delete("/delete/:id", deleteSegment);

export default router;
