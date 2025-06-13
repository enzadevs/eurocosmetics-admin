import express from "express";
import multer from "multer";
import sharp from "sharp";
import path, { extname } from "path";
import fs from "fs/promises";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

const ensureUploadDir = async () => {
  const uploadDir = path.join(process.cwd(), "uploads/segments");
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const optimizeAndSaveImage = async (buffer, filename, mimetype) => {
  await ensureUploadDir();

  const relativePath = path.join("uploads/segments", filename);
  const absolutePath = path.join(process.cwd(), relativePath);

  let sharpInstance = sharp(buffer, { failOnError: false }).resize(1000);

  switch (mimetype) {
    case "image/png":
      sharpInstance = sharpInstance.png({ quality: 98 });
      break;
    case "image/jpeg":
    case "image/jpg":
      sharpInstance = sharpInstance.jpeg({ quality: 98 });
      break;
    case "image/webp":
      sharpInstance = sharpInstance.webp({ quality: 98 });
      break;
    default:
      sharpInstance = sharpInstance.jpeg({ quality: 98 });
  }

  await sharpInstance.toFile(absolutePath);
  return relativePath;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

const parseNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
};

const fetchAll = asyncHandler(async (req, res) => {
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

  res.status(200).json({ segments });
});

const fetchAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  const whereClause = query
    ? {
        OR: [
          { nameRu: { contains: query, mode: "insensitive" } },
          { nameTm: { contains: query, mode: "insensitive" } },
        ],
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
    segments,
    pagination: {
      currentPage,
      totalPages,
      totalCount: segmentCount,
    },
  });
});

const fetchSegmentsClient = asyncHandler(async (req, res) => {
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

  res.status(200).json({ segments });
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const segment = await prisma.segment.findUnique({
    where: { id },
    include: {
      SubCategory: true,
    },
  });

  if (!segment) {
    return res.status(404).json({ message: "Сегмент не найден." });
  }

  res.status(200).json(segment);
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

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

  if (!segment) {
    return res.status(404).json({ message: "Сегмент не найден." });
  }

  res.status(200).json(segment);
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
  let coverImage = null;

  if (req.files) {
    if (req.files.image) {
      const iconFile = req.files.image[0];
      const fileExtension = extname(iconFile.originalname);
      const filename = `icon_${Date.now()}${fileExtension}`;
      image = await optimizeAndSaveImage(
        iconFile.buffer,
        filename,
        iconFile.mimetype
      );
    }

    if (req.files.coverImage) {
      const coverFile = req.files.coverImage[0];
      const fileExtension = extname(coverFile.originalname);
      const filename = `cover_${Date.now()}${fileExtension}`;
      coverImage = await optimizeAndSaveImage(
        coverFile.buffer,
        filename,
        coverFile.mimetype
      );
    }
  }

  await prisma.segment.create({
    data: {
      nameTm,
      nameRu,
      order: parseNumber(order),
      discountType,
      discountValue: parseNumber(discountValue),
      isActive: parseBoolean(isActive),
      image: image || "",
      coverImage: coverImage || "",
      SubCategory: {
        connect: {
          id: subCategoryId,
        },
      },
    },
  });

  res.status(201).json({ message: "Сегмент создан." });
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

  const existingSegment = await prisma.segment.findUnique({
    where: { id },
  });

  if (!existingSegment) {
    return res.status(404).json({ message: "Сегмент не найден." });
  }

  let categoryIcon = existingSegment.image;
  let categoryCover = existingSegment.coverImage;

  if (req.files) {
    if (req.files.image) {
      const iconFile = req.files.image[0];
      const fileExtension = extname(iconFile.originalname);
      const filename = `icon_${Date.now()}${fileExtension}`;
      categoryIcon = await optimizeAndSaveImage(
        iconFile.buffer,
        filename,
        iconFile.mimetype
      );
    }

    if (req.files.coverImage) {
      const coverFile = req.files.coverImage[0];
      const fileExtension = extname(coverFile.originalname);
      const filename = `cover_${Date.now()}${fileExtension}`;
      categoryCover = await optimizeAndSaveImage(
        coverFile.buffer,
        filename,
        coverFile.mimetype
      );
    }
  }

  const updatedSegmentData = {
    nameTm: nameTm || existingSegment.nameTm,
    nameRu: nameRu || existingSegment.nameRu,
    order: parseNumber(order, existingSegment.order),
    discountType: discountType || existingSegment.discountType,
    discountValue: parseNumber(discountValue, existingSegment.discountValue),
    isActive:
      isActive !== undefined
        ? parseBoolean(isActive)
        : existingSegment.isActive,
    image: categoryIcon,
    coverImage: categoryCover,
    SubCategory: {
      connect: { id: subCategoryId || existingSegment.subCategoryId },
    },
  };

  await prisma.$transaction(async (tx) => {
    await tx.segment.update({
      where: { id },
      data: updatedSegmentData,
    });

    if (isActive !== undefined) {
      await tx.product.updateMany({
        where: { segmentId: id },
        data: { isActive: parseBoolean(isActive) },
      });
    }
  });

  res.status(200).json({ message: "Сегмент обновлен." });
});

const deleteSegment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.segment.delete({
      where: { id },
    });
    res.status(200).json({ message: "Сегмент удален." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Сегмент не найден.",
      });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        message: "Невозможно удалить сегмент, так как он используется.",
      });
    }
    throw err;
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchAdmin);
router.get("/fetch/client", fetchSegmentsClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post(
  "/new",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  newSegment
);
router.patch(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateSegment
);
router.delete("/delete/:id", deleteSegment);

export default router;
