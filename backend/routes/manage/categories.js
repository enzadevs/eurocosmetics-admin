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
  const optimizedImagePath = path.join("uploads/categories/", filename);
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
    const categories = await prisma.category.findMany();

    res.status(200).json({ categories: categories });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ nameRu: { contains: query, mode: "insensitive" } }],
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
    });

    res.status(200).json({
      categories: categories,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchCategoriesClient = asyncHandler(async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
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
        Products: {
          some: {
            isActive: true,
            stock: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        order: true,
        nameTm: true,
        nameRu: true,
        image: true,
      },
      orderBy: { order: "asc" },
    });

    res.status(200).json({ categories: categories });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        SubCategories: true,
      },
    });

    return category
      ? res.status(200).send(category)
      : res.status(404).json({ message: "Категория не найдена." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
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

    return category
      ? res.status(200).send(category)
      : res.status(404).json({ message: "Категория не найдена." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newCategory = asyncHandler(async (req, res) => {
  const { nameTm, nameRu, order, isActive, discountType, discountValue } =
    req.body;

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
    await prisma.category.create({
      data: {
        nameTm,
        nameRu,
        order: Number(order),
        discountType,
        discountValue: Number(discountValue),
        isActive: JSON.parse(isActive),
        image: image || "",
      },
    });

    res.status(201).json({ message: "Категория создана." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании категории.");
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nameTm,
    nameRu,
    order,
    isActive,
    discountType,
    discountValue,
    deliveryPrice,
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
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({ message: "Категория не найдена." });
    }

    const updatedCategoryData = {
      nameTm: nameTm || existingCategory.nameTm,
      nameRu: nameRu || existingCategory.nameRu,
      order: Number(order) || existingCategory.order,
      discountType: discountType || existingCategory.discountType,
      discountValue: Number(discountValue) || existingCategory.discountValue,
      deliveryPrice:
        deliveryPrice !== undefined && deliveryPrice !== null
          ? Number(deliveryPrice)
          : existingProduct.deliveryPrice,
      isActive: JSON.parse(isActive),
      image: image || existingCategory.image,
    };

    await prisma.category.update({
      where: { id },
      data: updatedCategoryData,
    });

    await prisma.subCategory.updateMany({
      where: { categoryId: id },
      data: { isActive: JSON.parse(isActive) },
    });

    res.status(201).json({ message: "Категория обновлена." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении категории.");
  }
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
      return res.status(409).json({
        message: "Категория не найдена.",
      });
    } else {
      res.status(500).send("Ошибка при удалении категории.");
    }
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchAdmin);
router.get("/fetch/client", fetchCategoriesClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post("/new/", upload.single("image"), newCategory);
router.patch("/update/:id", upload.single("image"), updateCategory);
router.delete("/delete/:id", deleteCategory);

export default router;
