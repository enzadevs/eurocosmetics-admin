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
  const uploadDir = path.join(process.cwd(), "uploads/subcategories");
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const optimizeAndSaveImage = async (buffer, filename, mimetype) => {
  await ensureUploadDir();

  const relativePath = path.join("uploads/subcategories", filename);
  const absolutePath = path.join(process.cwd(), relativePath);

  let sharpInstance = sharp(buffer, { failOnError: false }).resize(2000);

  switch (mimetype) {
    case "image/png":
      sharpInstance = sharpInstance.png({ quality: 100 });
      break;
    case "image/jpeg":
    case "image/jpg":
      sharpInstance = sharpInstance.jpeg({ quality: 100 });
      break;
    case "image/webp":
      sharpInstance = sharpInstance.webp({ quality: 100 });
      break;
    default:
      sharpInstance = sharpInstance.jpeg({ quality: 100 });
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
  const subCategories = await prisma.subCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      nameTm: true,
      nameRu: true,
      image: true,
      isActive: true,
      Category: {
        select: {
          nameRu: true,
        },
      },
    },
  });

  res.status(200).json({ subCategories });
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

  const subCatCount = await prisma.subCategory.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(subCatCount / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const subCategories = await prisma.subCategory.findMany({
    skip: (currentPage - 1) * limit,
    take: limit,
    where: whereClause,
    orderBy: { order: "asc" },
    include: {
      Category: {
        select: {
          nameRu: true,
        },
      },
    },
  });

  res.status(200).json({
    subCategories,
    pagination: {
      currentPage,
      totalPages,
      totalCount: subCatCount,
    },
  });
});

const fetchSubCategoriesClient = asyncHandler(async (req, res) => {
  const subCategories = await prisma.subCategory.findMany({
    orderBy: { order: "asc" },
    where: {
      isActive: true,
      OR: [
        {
          Products: {
            some: {
              isActive: true,
              stock: { gt: 0 },
              currentSellPrice: { gt: 0 },
            },
          },
        },
        {
          Segments: {
            some: {
              isActive: true,
              Products: {
                some: {
                  isActive: true,
                  stock: { gt: 0 },
                  currentSellPrice: { gt: 0 },
                },
              },
            },
          },
        },
      ],
    },
    include: {
      Segments: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  res.status(200).json({ subCategories });
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    include: {
      Category: true,
      Segments: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!subCategory) {
    return res.status(404).json({ message: "Подкатегория не найдена." });
  }

  res.status(200).json(subCategory);
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    select: {
      id: true,
      nameTm: true,
      nameRu: true,
      image: true,
      Category: {
        select: {
          nameTm: true,
          nameRu: true,
        },
      },
      Segments: {
        orderBy: { order: "asc" },
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
      },
    },
  });

  if (!subCategory) {
    return res.status(404).json({ message: "Подкатегория не найдена." });
  }

  res.status(200).json(subCategory);
});

const newSubCategory = asyncHandler(async (req, res) => {
  const {
    nameTm,
    nameRu,
    order,
    isActive,
    discountType,
    discountValue,
    categoryId,
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

  await prisma.subCategory.create({
    data: {
      nameTm,
      nameRu,
      order: parseNumber(order),
      discountType,
      discountValue: parseNumber(discountValue),
      isActive: parseBoolean(isActive),
      image: image || "",
      coverImage: coverImage || "",
      Category: {
        connect: {
          id: categoryId,
        },
      },
    },
  });

  res.status(201).json({ message: "Подкатегория создана." });
});

const updateSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameTm,
    nameRu,
    order,
    isActive,
    discountType,
    discountValue,
    categoryId,
  } = req.body;

  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id },
  });

  if (!existingSubCategory) {
    return res.status(404).json({ message: "Подкатегория не найдена." });
  }

  let categoryIcon = existingSubCategory.image;
  let categoryCover = existingSubCategory.coverImage;

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

  const updatedSubCategoryData = {
    nameTm: nameTm || existingSubCategory.nameTm,
    nameRu: nameRu || existingSubCategory.nameRu,
    order: parseNumber(order, existingSubCategory.order),
    discountType: discountType || existingSubCategory.discountType,
    discountValue: parseNumber(
      discountValue,
      existingSubCategory.discountValue
    ),
    isActive:
      isActive !== undefined
        ? parseBoolean(isActive)
        : existingSubCategory.isActive,
    image: categoryIcon,
    coverImage: categoryCover,
    Category: {
      connect: { id: categoryId || existingSubCategory.categoryId },
    },
  };

  await prisma.$transaction(async (tx) => {
    await tx.subCategory.update({
      where: { id },
      data: updatedSubCategoryData,
    });

    if (isActive !== undefined) {
      await tx.segment.updateMany({
        where: { subCategoryId: id },
        data: { isActive: parseBoolean(isActive) },
      });
    }
  });

  res.status(200).json({ message: "Подкатегория обновлена." });
});

const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.subCategory.delete({
      where: { id },
    });
    res.status(200).json({ message: "Подкатегория удалена." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Подкатегория не найдена.",
      });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        message: "Невозможно удалить подкатегорию, так как она используется.",
      });
    }
    throw err;
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchAdmin);
router.get("/fetch/client", fetchSubCategoriesClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post(
  "/new",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  newSubCategory
);
router.patch(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateSubCategory
);
router.delete("/delete/:id", deleteSubCategory);

export default router;
