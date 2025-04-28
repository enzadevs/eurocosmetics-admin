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
  const optimizedImagePath = path.join("uploads/subcategories/", filename);
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
    const subCategories = await prisma.subCategory.findMany({
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

    res.status(200).json({ subCategories: subCategories });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchSubCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ nameRu: { contains: query, mode: "insensitive" } }],
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
      include: {
        Category: {
          select: {
            nameRu: true,
          },
        },
      },
    });

    res.status(200).json({
      subCategories: subCategories,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchSubCategoriesClient = asyncHandler(async (req, res) => {
  try {
    const subCategories = await prisma.subCategory.findMany({
      orderBy: { order: "asc" },
      where: {
        isActive: true,
        Products: {
          some: {
            isActive: true,
            stock: { gt: 0 },
          },
        },
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
      include: {
        Segments: true,
      },
    });

    res.status(200).json({ subCategories: subCategories });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        Category: true,
        Segments: true,
      },
    });

    return subCategory
      ? res.status(200).send(subCategory)
      : res.status(404).json({ message: "Подкатегория не найдена." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchByIdForClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
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

    return subCategory
      ? res.status(200).send(subCategory)
      : res.status(404).json({ message: "Подкатегория не найдена." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
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
    await prisma.subCategory.create({
      data: {
        nameTm,
        nameRu,
        order: Number(order),
        discountType,
        discountValue: Number(discountValue),
        isActive: JSON.parse(isActive),
        image: image || "",
        Category: {
          connect: {
            id: categoryId,
          },
        },
      },
    });

    res.status(201).json({ message: "Подкатегория создана." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании под категории.");
  }
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
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
    });

    if (!existingSubCategory) {
      return res.status(404).json({ message: "Подкатегория не найдена." });
    }

    const updatedsubCategoryData = {
      nameTm: nameTm || existingSubCategory.nameTm,
      nameRu: nameRu || existingSubCategory.nameRu,
      order: Number(order) || existingSubCategory.order,
      discountType: discountType || existingSubCategory.discountType,
      discountValue: Number(discountValue) || existingSubCategory.discountValue,
      isActive: JSON.parse(isActive),
      image: image || existingSubCategory.image,
      Category: {
        connect: { id: categoryId || existingSubCategory.categoryId },
      },
    };

    await prisma.subCategory.update({
      where: { id },
      data: updatedsubCategoryData,
    });

    await prisma.segment.updateMany({
      where: { subCategoryId: id },
      data: { isActive: JSON.parse(isActive) },
    });

    res.status(201).json({ message: "Подкатегория обновлена." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении категории.");
  }
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
      return res.status(409).json({
        message: "Подкатегория не найдена.",
      });
    } else {
      res.status(500).send("Ошибка при удалении под категории.");
    }
  }
});

router.get("/fetch/all", fetchAll);
router.post("/fetch/admin", fetchSubCategories);
router.get("/fetch/client", fetchSubCategoriesClient);
router.get("/fetch/single/:id", fetchById);
router.get("/fetch/client/:id", fetchByIdForClient);
router.post("/new/", upload.single("image"), newSubCategory);
router.patch("/update/:id", upload.single("image"), updateSubCategory);
router.delete("/delete/:id", deleteSubCategory);

export default router;
