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
  const optimizedImagePath = join("uploads/stories/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(1000)
    .jpeg({ quality: 97 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchAllStories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.body;

  try {
    const storyCount = await prisma.story.count();
    const totalPages = Math.ceil(storyCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const stories = await prisma.story.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    const formattedStories = stories.map((item) => {
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
      stories: formattedStories,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchActiveStories = asyncHandler(async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
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

    const formattedStories = stories.map((item) => {
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

    res.status(200).json({ stories: formattedStories });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchStoryByID = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const story = await prisma.story.findUnique({
      where: { id: Number(id) },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
        Brand: true,
      },
    });

    if (!story) {
      return res.status(404).json({ message: "Stories не найден." });
    }

    res.status(200).json(story);
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newStory = asyncHandler(async (req, res) => {
  const {
    name,
    order,
    startDate,
    endDate,
    isActive,
    categoryId,
    subCategoryId,
    segmentId,
    productBarcode,
    brandId,
    productsArray = [],
    videoDuration,
  } = req.body;

  const getNullOrValue = (value) => (value === "null" ? null : value);

  let idToInclude =
    getNullOrValue(productBarcode) ||
    getNullOrValue(categoryId) ||
    getNullOrValue(subCategoryId) ||
    getNullOrValue(segmentId) ||
    getNullOrValue(brandId);

  let url = idToInclude ? idToInclude : null;

  let storyImage = null;

  if (req.file) {
    const fileExtension = extname(req.file.originalname);
    const filename = `${Date.now()}${fileExtension}`;
    storyImage = await optimizeAndSaveImage(req.file.buffer, filename);
  }

  let storyData = {
    name: name,
    order: Number(order),
    isActive: JSON.parse(isActive),
    ProductsArray: JSON.parse(productsArray),
    link: url,
    videoDuration: videoDuration,
    image: storyImage,
    startDate: new Date(startDate) || null,
    endDate: new Date(endDate) || null,
  };

  if (productBarcode && productBarcode !== "null")
    storyData.Product = { connect: { barcode: productBarcode } };
  if (categoryId && categoryId !== "null")
    storyData.Category = { connect: { id: categoryId } };
  if (subCategoryId && subCategoryId !== "null")
    storyData.SubCategory = { connect: { id: subCategoryId } };
  if (segmentId && segmentId !== "null")
    storyData.Segment = { connect: { id: segmentId } };
  if (brandId && brandId !== "null")
    storyData.Brand = { connect: { id: brandId } };

  try {
    await prisma.story.create({ data: storyData });

    res.status(201).json({ message: "Stories успешно создано." });
  } catch (err) {
    res.status(500).send("Ошибка при создании Stories.");
  }
});

const updateStory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    isActive,
    productBarcode,
    categoryId,
    subCategoryId,
    segmentId,
    brandId,
    startDate,
    endDate,
    productsArray,
    videoDuration,
  } = req.body;

  const getNullOrValue = (value) => (value === "null" ? null : value);

  try {
    const existingStory = await prisma.story.findUnique({
      where: { id: Number(id) },
    });

    if (!existingStory) {
      return res.status(404).json({ message: "Stories не найден." });
    }

    let idToInclude =
      getNullOrValue(productBarcode) ||
      getNullOrValue(categoryId) ||
      getNullOrValue(subCategoryId) ||
      getNullOrValue(segmentId) ||
      getNullOrValue(brandId);

    let url = idToInclude ? idToInclude : null;

    let storyImage = null;

    if (req.file) {
      const fileExtension = extname(req.file.originalname);
      const filename = `${Date.now()}${fileExtension}`;
      storyImage = await optimizeAndSaveImage(req.file.buffer, filename);
    }

    const newStoryData = {
      name: getNullOrValue(name) || existingBanner.name,
      videoDuration: videoDuration || existingBanner.videoDuration,
      order: Number(order) || existingBanner.order,
      isActive: JSON.parse(isActive),
      ProductsArray: JSON.parse(productsArray) || existingBanner.ProductsArray,
      link: url || existingBanner.link,
      startDate: new Date(startDate) || existingBanner.startDate,
      endDate: new Date(endDate) || existingBanner.endDate,
    };

    if (productBarcode && productBarcode !== "null")
      newStoryData.Product = { connect: { barcode: productBarcode } };
    if (categoryId && categoryId !== "null")
      newStoryData.Category = { connect: { id: categoryId } };
    if (subCategoryId && subCategoryId !== "null")
      newStoryData.SubCategory = { connect: { id: subCategoryId } };
    if (segmentId && segmentId !== "null")
      newStoryData.Segment = { connect: { id: segmentId } };
    if (brandId && brandId !== "null")
      newStoryData.Brand = { connect: { id: brandId } };

    if (req.file) {
      newStoryData.image = storyImage;
    } else {
      newStoryData.image = existingStory.image;
    }

    await prisma.story.update({
      where: { id: Number(id) },
      data: newStoryData,
    });

    res.status(201).json({ message: "Stories успешно обновлен." });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении Stories.");
  }
});

const deleteStory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const story = await prisma.story.delete({
      where: { id: Number(id) },
    });
    return story
      ? res.json({ message: "Stories удален." })
      : res.status(404).json({ message: "Stories не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при удалении Stories.");
  }
});

router.post("/all", fetchAllStories);
router.get("/active", fetchActiveStories);
router.get("/fetch/:id", fetchStoryByID);
router.post("/new", upload.single("image"), newStory);
router.patch("/update/:id", upload.single("image"), updateStory);
router.delete("/delete/:id", deleteStory);

export default router;
