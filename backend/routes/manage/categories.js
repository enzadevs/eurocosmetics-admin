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
  const uploadDir = path.join(process.cwd(), "uploads/categories");
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

const optimizeAndSaveImage = async (buffer, filename, mimetype) => {
  await ensureUploadDir();

  const relativePath = path.join("uploads/categories", filename);
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
  const categories = await prisma.category.findMany();
  res.status(200).json({ categories });
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

  const categoriesCount = await prisma.category.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(categoriesCount / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const categories = await prisma.category.findMany({
    skip: (currentPage - 1) * limit,
    take: limit,
    where: whereClause,
    include: {
      SubCategories: true,
    },
    orderBy: { order: "asc" },
  });

  res.status(200).json({
    categories,
    pagination: {
      currentPage,
      totalPages,
      totalCount: categoriesCount,
    },
  });
});

const fetchCategoriesClient = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      OR: [
        {
          SubCategories: {
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
        {
          Products: {
            some: {
              isActive: true,
              stock: { gt: 0 },
              currentSellPrice: { gt: 0 },
            },
          },
        },
      ],
    },
    include: {
      SubCategories: {
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
            where: {
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
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  res.status(200).json({ categories });
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      SubCategories: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!category) {
    return res.status(404).json({ message: "Категория не найдена." });
  }

  res.status(200).json(category);
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      SubCategories: {
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

  if (!category) {
    return res.status(404).json({ message: "Категория не найдена." });
  }

  res.status(200).json(category);
});

const newCategory = asyncHandler(async (req, res) => {
  const { nameTm, nameRu, order, isActive, discountType, discountValue } =
    req.body;

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

  await prisma.category.create({
    data: {
      nameTm,
      nameRu,
      order: parseNumber(order),
      discountType,
      discountValue: parseNumber(discountValue),
      isActive: parseBoolean(isActive),
      image: image || "",
      coverImage: coverImage || "",
    },
  });

  res.status(201).json({ message: "Категория создана." });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nameTm, nameRu, order, isActive, discountType, discountValue } =
    req.body;

  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    return res.status(404).json({ message: "Категория не найдена." });
  }

  let categoryIcon = existingCategory.image;
  let categoryCover = existingCategory.coverImage;

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

  const updatedCategoryData = {
    nameTm: nameTm || existingCategory.nameTm,
    nameRu: nameRu || existingCategory.nameRu,
    order: parseNumber(order, existingCategory.order),
    discountType: discountType || existingCategory.discountType,
    discountValue: parseNumber(discountValue, existingCategory.discountValue),
    isActive:
      isActive !== undefined
        ? parseBoolean(isActive)
        : existingCategory.isActive,
    image: categoryIcon,
    coverImage: categoryCover,
  };

  await prisma.$transaction(async (tx) => {
    await tx.category.update({
      where: { id },
      data: updatedCategoryData,
    });

    if (isActive !== undefined) {
      await tx.subCategory.updateMany({
        where: { categoryId: id },
        data: { isActive: parseBoolean(isActive) },
      });
    }
  });

  res.status(200).json({ message: "Категория обновлена." });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.category.delete({
      where: { id },
    });
    res.status(200).json({ message: "Категория удалена." });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Категория не найдена.",
      });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        message: "Невозможно удалить категорию, так как она используется.",
      });
    }
    throw err;
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchAdmin);
router.get("/fetch/client", fetchCategoriesClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post(
  "/new",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  newCategory
);
router.patch(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateCategory
);
router.delete("/delete/:id", deleteCategory);

export default router;
