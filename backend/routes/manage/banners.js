import express from "express";
import multer from "multer";
import sharp from "sharp";
import { extname, join } from "path";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const optimizeAndSaveImage = async (buffer, filename) => {
  const optimizedImagePath = join("uploads/banner/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(1500)
    .jpeg({ quality: 97 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const saveVideo = async (buffer, filename) => {
  const videoPath = join("uploads/banner/videos/", filename);
  const fs = await import("fs/promises");
  await fs.writeFile(videoPath, buffer);
  return videoPath;
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
        // startDate: { lte: new Date() },
        // endDate: { gte: new Date() },
      },
      orderBy: { order: "asc" },
      include: {
        Product: true,
        Category: true,
        SubCategory: true,
        Segment: true,
        Brand: true,
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
        Brand: true,
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
    brandId,
    productBarcode,
    productsArray = [],
    videoDuration,
  } = req.body;

  const getNullOrValue = (value) =>
    value === "null" || value === "" ? null : value;

  let idToInclude =
    getNullOrValue(productBarcode) ||
    getNullOrValue(categoryId) ||
    getNullOrValue(subCategoryId) ||
    getNullOrValue(segmentId) ||
    getNullOrValue(brandId);

  let url = idToInclude ? idToInclude : null;

  let bannerImage = null;
  let bannerVideo = null;
  let mobileImage = null;
  let mobileVideo = null;

  if (req.files) {
    if (req.files.image) {
      const imageFile = req.files.image[0];
      const fileExtension = extname(imageFile.originalname);
      const filename = `image_${Date.now()}${fileExtension}`;
      bannerImage = await optimizeAndSaveImage(imageFile.buffer, filename);
    }

    if (req.files.video) {
      const videoFile = req.files.video[0];
      const fileExtension = extname(videoFile.originalname);
      const filename = `video_${Date.now()}${fileExtension}`;
      bannerVideo = await saveVideo(videoFile.buffer, filename);
    }

    if (req.files.mobileImage) {
      const imageFile = req.files.mobileImage[0];
      const fileExtension = extname(imageFile.originalname);
      const filename = `mobimage_${Date.now()}${fileExtension}`;
      bannerImage = await optimizeAndSaveImage(imageFile.buffer, filename);
    }

    if (req.files.mobileVideo) {
      const videoFile = req.files.mobileVideo[0];
      const fileExtension = extname(videoFile.originalname);
      const filename = `mobvideo_${Date.now()}${fileExtension}`;
      mobileVideo = await saveVideo(videoFile.buffer, filename);
    }
  }

  let bannerData = {
    name: name,
    order: Number(order),
    isActive: JSON.parse(isActive),
    ProductsArray: JSON.parse(productsArray),
    link: url,
    image: bannerImage,
    video: bannerVideo,
    mobileImage: mobileImage,
    mobileVideo: mobileVideo,
    videoDuration: videoDuration,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  };

  if (productBarcode && productBarcode !== "null")
    bannerData.Product = { connect: { barcode: productBarcode } };
  if (categoryId && categoryId !== "null")
    bannerData.Category = { connect: { id: categoryId } };
  if (subCategoryId && subCategoryId !== "null")
    bannerData.SubCategory = { connect: { id: subCategoryId } };
  if (segmentId && segmentId !== "null")
    bannerData.Segment = { connect: { id: segmentId } };
  if (brandId && brandId !== "null")
    bannerData.Brand = { connect: { id: brandId } };

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
    brandId,
    startDate,
    endDate,
    productsArray,
    videoDuration,
  } = req.body;

  const getNullOrValue = (value) =>
    value === "null" || value === "" ? null : value;

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
      getNullOrValue(segmentId) ||
      getNullOrValue(brandId);

    let url = idToInclude ? idToInclude : null;

    let bannerImage = existingBanner.image;
    let bannerVideo = existingBanner.video;
    let mobileImage = existingBanner.mobileImage;
    let mobileVideo = existingBanner.mobileVideo;

    if (req.files) {
      if (req.files.image) {
        const imageFile = req.files.image[0];
        const fileExtension = extname(imageFile.originalname);
        const filename = `image_${Date.now()}${fileExtension}`;
        bannerImage = await optimizeAndSaveImage(imageFile.buffer, filename);
      }

      if (req.files.video) {
        const videoFile = req.files.video[0];
        const fileExtension = extname(videoFile.originalname);
        const filename = `video_${Date.now()}${fileExtension}`;
        bannerVideo = await saveVideo(videoFile.buffer, filename);
      }

      if (req.files.mobileImage) {
        const imageFile = req.files.mobileImage[0];
        const fileExtension = extname(imageFile.originalname);
        const filename = `mobimage_${Date.now()}${fileExtension}`;
        mobileImage = await optimizeAndSaveImage(imageFile.buffer, filename);
      }

      if (req.files.mobileVideo) {
        const videoFile = req.files.mobileVideo[0];
        const fileExtension = extname(videoFile.originalname);
        const filename = `mobvideo_${Date.now()}${fileExtension}`;
        mobileVideo = await saveVideo(videoFile.buffer, filename);
      }
    }

    const newBannerData = {
      name: getNullOrValue(name) || existingBanner.name,
      order: order ? Number(order) : existingBanner.order,
      isActive: isActive ? JSON.parse(isActive) : existingBanner.isActive,
      videoDuration: videoDuration
        ? videoDuration
        : existingBanner.videoDuration,
      ProductsArray: productsArray
        ? JSON.parse(productsArray)
        : existingBanner.ProductsArray,
      link: url !== null ? url : existingBanner.link,
      startDate: startDate ? new Date(startDate) : existingBanner.startDate,
      endDate: endDate ? new Date(endDate) : existingBanner.endDate,
      image: bannerImage,
      video: bannerVideo,
      mobileImage: mobileImage,
      mobileVideo: mobileVideo,
    };

    if (productBarcode && productBarcode !== "null") {
      newBannerData.Product = { connect: { barcode: productBarcode } };
    } else if (productBarcode === "null") {
      newBannerData.Product = { disconnect: true };
    }

    if (categoryId && categoryId !== "null") {
      newBannerData.Category = { connect: { id: categoryId } };
    } else if (categoryId === "null") {
      newBannerData.Category = { disconnect: true };
    }

    if (subCategoryId && subCategoryId !== "null") {
      newBannerData.SubCategory = { connect: { id: subCategoryId } };
    } else if (subCategoryId === "null") {
      newBannerData.SubCategory = { disconnect: true };
    }

    if (segmentId && segmentId !== "null") {
      newBannerData.Segment = { connect: { id: segmentId } };
    } else if (segmentId === "null") {
      newBannerData.Segment = { disconnect: true };
    }

    if (brandId && brandId !== "null") {
      newBannerData.Brand = { connect: { id: brandId } };
    } else if (brandId === "null") {
      newBannerData.Brand = { disconnect: true };
    }

    await prisma.banner.update({
      where: { id: Number(id) },
      data: newBannerData,
    });

    res.status(200).json({ message: "Баннер успешно обновлен." });
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
router.post(
  "/new",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
    { name: "mobileVideo", maxCount: 1 },
  ]),
  newBanner
);
router.patch(
  "/update/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "mobileImage", maxCount: 1 },
    { name: "mobileVideo", maxCount: 1 },
  ]),
  updateBanner
);
router.delete("/delete/:id", deleteBanner);

export default router;
