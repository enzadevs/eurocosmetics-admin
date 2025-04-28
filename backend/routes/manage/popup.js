import express from "express";
import multer from "multer";
import sharp from "sharp";
import { extname, join } from "path";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();
const multerStorage = multer;
const storage = multer.memoryStorage();
const upload = multerStorage({ storage: storage });

const optimizeAndSaveImage = async (buffer, filename) => {
  const optimizedImagePath = join("uploads/popup/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(800)
    .jpeg({ quality: 97 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchAllpopUps = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.body;

  try {
    const popUpCount = await prisma.popUp.count();
    const totalPages = Math.ceil(popUpCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const popUps = await prisma.popUp.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    const formattedpopUps = popUps.map((item) => {
      const formattedCreatedAt = new Date(item.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );
      const formattedUpdatedAt = new Date(item.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...item,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({
      popUps: formattedpopUps,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchActivepopUps = asyncHandler(async (req, res) => {
  try {
    const popUps = await prisma.popUp.findMany({
      where: {
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
        Brand: true,
      },
    });

    const formattedpopUps = popUps.map((item) => {
      const formattedCreatedAt = new Date(item.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );
      const formattedUpdatedAt = new Date(item.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...item,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({ popUps: formattedpopUps });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchpopUpById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const popUp = await prisma.popUp.findUnique({
      where: { id: Number(id) },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
        Brand: true,
      },
    });

    if (!popUp) {
      return res.status(404).json({ message: "Баннер не найден." });
    }

    res.status(200).json(popUp);
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newpopUp = asyncHandler(async (req, res) => {
  const {
    name,
    isActive,
    countdown,
    categoryId,
    subCategoryId,
    segmentId,
    productBarcode,
    brandId,
  } = req.body;

  const getNullOrValue = (value) => (value === "null" ? null : value);

  let idToInclude =
    getNullOrValue(productBarcode) ||
    getNullOrValue(categoryId) ||
    getNullOrValue(subCategoryId) ||
    getNullOrValue(segmentId) ||
    getNullOrValue(brandId);

  let url = idToInclude ? idToInclude : null;

  let popUpImage = null;

  if (req.file) {
    const fileExtension = extname(req.file.originalname);
    const filename = `${Date.now()}${fileExtension}`;
    popUpImage = await optimizeAndSaveImage(req.file.buffer, filename);
  }

  let popUpData = {
    name: name,
    isActive: JSON.parse(isActive),
    countdown: Number(countdown),
    link: url,
    image: popUpImage,
  };

  if (productBarcode && productBarcode !== "null")
    popUpData.Product = { connect: { barcode: productBarcode } };
  if (categoryId && categoryId !== "null")
    popUpData.Category = { connect: { id: categoryId } };
  if (subCategoryId && subCategoryId !== "null")
    popUpData.SubCategory = { connect: { id: subCategoryId } };
  if (segmentId && segmentId !== "null")
    popUpData.Segment = { connect: { id: segmentId } };
  if (brandId && brandId !== "null")
    popUpData.Brand = { connect: { id: brandId } };

  try {
    await prisma.popUp.create({ data: popUpData });

    res.status(201).json({ message: "Баннер успешно создан." });
  } catch (err) {
    res.status(500).send("Ошибка при создании баннера.");
  }
});

const updatepopUp = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    isActive,
    countdown,
    productBarcode,
    categoryId,
    subCategoryId,
    segmentId,
    brandId,
  } = req.body;

  const getNullOrValue = (value) => (value === "null" ? null : value);

  try {
    const existingPopUp = await prisma.popUp.findUnique({
      where: { id: Number(id) },
    });

    if (!existingPopUp) {
      return res.status(404).json({ message: "Баннер не найден." });
    }

    let idToInclude =
      getNullOrValue(productBarcode) ||
      getNullOrValue(categoryId) ||
      getNullOrValue(subCategoryId) ||
      getNullOrValue(segmentId) ||
      getNullOrValue(brandId);

    let url = idToInclude ? idToInclude : null;

    let popUpImage = null;

    if (req.file) {
      const fileExtension = extname(req.file.originalname);
      const filename = `${Date.now()}${fileExtension}`;
      popUpImage = await optimizeAndSaveImage(req.file.buffer, filename);
    }

    const newpopUpData = {
      name: getNullOrValue(name) || existingPopUp.name,
      isActive: JSON.parse(isActive),
      countdown: Number(countdown) || existingPopUp.countdown,
      link: url || existingPopUp.link,
    };

    if (productBarcode && productBarcode !== "null")
      newpopUpData.Product = { connect: { barcode: productBarcode } };
    if (categoryId && categoryId !== "null")
      newpopUpData.Category = { connect: { id: categoryId } };
    if (subCategoryId && subCategoryId !== "null")
      newpopUpData.SubCategory = { connect: { id: subCategoryId } };
    if (segmentId && segmentId !== "null")
      newpopUpData.Segment = { connect: { id: segmentId } };
    if (brandId && brandId !== "null")
      newpopUpData.Brand = { connect: { id: brandId } };

    if (req.file) {
      newpopUpData.image = popUpImage;
    } else {
      newpopUpData.image = existingPopUp.image;
    }

    await prisma.popUp.update({
      where: { id: Number(id) },
      data: newpopUpData,
    });

    res.status(201).json({ message: "Баннер успешно обновлен." });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении баннера.");
  }
});

const deletePopUp = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const popUp = await prisma.popUp.delete({
      where: { id: Number(id) },
    });
    return popUp
      ? res.json({ message: "Баннер удален." })
      : res.status(404).json({ message: "Баннер не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при удалении баннера.");
  }
});

router.post("/all", fetchAllpopUps);
router.get("/active", fetchActivepopUps);
router.get("/fetch/:id", fetchpopUpById);
router.post("/new", upload.single("image"), newpopUp);
router.patch("/update/:id", upload.single("image"), updatepopUp);
router.delete("/delete/:id", deletePopUp);

export default router;
