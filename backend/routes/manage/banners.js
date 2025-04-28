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
  const optimizedImagePath = join("uploads/banner/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(700)
    .jpeg({ quality: 97 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchAllBanners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.body;

  try {
    const bannersCount = await prisma.banner.count();
    const totalPages = Math.ceil(bannersCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const banners = await prisma.banner.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: { order: "asc" },
    });

    const formattedBanners = banners.map((item) => {
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
      banners: formattedBanners,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchActiveBanners = asyncHandler(async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
      },
      orderBy: { order: "asc" },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
      },
    });

    const formattedBanners = banners.map((banner) => {
      const formattedCreatedAt = new Date(banner.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );
      const formattedUpdatedAt = new Date(banner.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...banner,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({ banners: formattedBanners });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchBannerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await prisma.banner.findUnique({
      where: { id: Number(id) },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
      },
    });

    if (!banner) {
      return res.status(404).json({ message: "Баннер не найден." });
    }

    let arrayOfProducts = [];
    if (banner.ProductsArray && banner.ProductsArray.length > 0) {
      arrayOfProducts = await prisma.product.findMany({
        where: {
          barcode: {
            in: banner.ProductsArray,
          },
        },
        select: {
          id: true,
          barcode: true,
          nameTm: true,
          nameRu: true,
          sellPrice: true,
          currentSellPrice: true,
          discountType: true,
          discountValue: true,
          unit: true,
          Status: {
            select: {
              id: true,
              nameRu: true,
              nameTm: true,
            },
          },
          stock: true,
          imageOne: true,
          limit: true,
        },
      });
    }

    const result = {
      ...banner,
      arrayOfProducts,
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching banner:", err);
    res
      .status(500)
      .json({ message: "Ошибка при получении данных.", error: err.message });
  }
});

const newBanner = asyncHandler(async (req, res) => {
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
    productsArray = [],
  } = req.body;

  const parseDate = (value) => {
    if (value === "null" || value === null || value === undefined) return null;
    return new Date(value);
  };

  const getNullOrValue = (value) => (value === "null" ? null : value);

  let idToInclude =
    getNullOrValue(productBarcode) ||
    getNullOrValue(categoryId) ||
    getNullOrValue(subCategoryId) ||
    getNullOrValue(segmentId);

  let url = idToInclude ? idToInclude : null;

  let bannerImage = null;

  if (req.file) {
    const fileExtension = extname(req.file.originalname);
    const filename = `${Date.now()}${fileExtension}`;
    bannerImage = await optimizeAndSaveImage(req.file.buffer, filename);
  }

  let bannerData = {
    name: name,
    order: Number(order),
    isActive: JSON.parse(isActive),
    ProductsArray: JSON.parse(productsArray),
    link: url,
    image: bannerImage,
  };

  if (productBarcode && productBarcode !== "null")
    bannerData.Product = { connect: { barcode: productBarcode } };
  if (categoryId && categoryId !== "null")
    bannerData.Category = { connect: { id: categoryId } };
  if (subCategoryId && subCategoryId !== "null")
    bannerData.SubCategory = { connect: { id: subCategoryId } };
  if (segmentId && segmentId !== "null")
    bannerData.Segment = { connect: { id: segmentId } };

  try {
    await prisma.banner.create({ data: bannerData });

    res.status(201).json({ message: "Баннер успешно создан." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании баннера.");
  }
});

const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    name,
    order,
    isActive,
    productBarcode,
    categoryId,
    subCategoryId,
    segmentId,
    productsArray,
  } = req.body;

  console.log(req.body);

  const getNullOrValue = (value) => (value === "null" ? null : value);

  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id: Number(id) },
    });

    if (!existingBanner) {
      return res.status(404).json({ message: "Баннер не найден." });
    }

    let idToInclude =
      getNullOrValue(productBarcode) ||
      getNullOrValue(categoryId) ||
      getNullOrValue(subCategoryId) ||
      getNullOrValue(segmentId);

    let url = idToInclude ? idToInclude : null;

    let bannerImage = null;

    if (req.file) {
      const fileExtension = extname(req.file.originalname);
      const filename = `${Date.now()}${fileExtension}`;
      bannerImage = await optimizeAndSaveImage(req.file.buffer, filename);
    }

    const newBannerData = {
      name: getNullOrValue(name) || existingBanner.name,
      order: Number(order) || existingBanner.order,
      isActive: JSON.parse(isActive),
      ProductsArray: JSON.parse(productsArray) || existingBanner.ProductsArray,
      link: url || existingBanner.link,
    };

    if (productBarcode && productBarcode !== "null")
      newBannerData.Product = { connect: { barcode: productBarcode } };
    if (categoryId && categoryId !== "null")
      newBannerData.Category = { connect: { id: categoryId } };
    if (subCategoryId && subCategoryId !== "null")
      newBannerData.SubCategory = { connect: { id: subCategoryId } };
    if (segmentId && segmentId !== "null")
      newBannerData.Segment = { connect: { id: segmentId } };

    if (req.file) {
      newBannerData.image = bannerImage;
    } else {
      newBannerData.image = existingBanner.image;
    }

    await prisma.banner.update({
      where: { id: Number(id) },
      data: newBannerData,
    });

    res.status(201).json({ message: "Баннер успешно обновлен." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении баннера.");
  }
});

const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await prisma.banner.delete({
      where: { id: Number(id) },
    });
    return banner
      ? res.json({ message: "Баннер удален." })
      : res.status(404).json({ message: "Баннер не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при удалении баннера.");
  }
});

router.post("/all", fetchAllBanners);
router.get("/active", fetchActiveBanners);
router.get("/fetch/:id", fetchBannerById);
router.post("/new", upload.single("image"), newBanner);
router.patch("/update/:id", upload.single("image"), updateBanner);
router.delete("/delete/:id", deleteBanner);

export default router;
