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
  const optimizedImagePath = join("uploads/brands/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(300)
    .jpeg({ quality: 98 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchAll = asyncHandler(async (req, res) => {
  try {
    const brands = await prisma.brand.findMany();

    res.status(200).json({ brands: brands });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchBrands = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        }
      : {};

    const brandsCount = await prisma.brand.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(brandsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const brands = await prisma.brand.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formattedBrands = brands.map((brand) => {
      const formattedCreatedAt = new Date(brand.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      const formattedUpdatedAt = new Date(brand.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...brand,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({
      brands: formattedBrands,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const sendBrandsToClient = asyncHandler(async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        Products: {
          some: {
            isActive: true,
            stock: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        discountType: true,
        discountValue: true,
      },
    });
    res.status(200).json({ brands: brands });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      return res.status(404).json({ message: "Бренд не найден." });
    }

    const formattedCreatedAt = new Date(brand.createdAt).toLocaleString(
      "en-GB",
      timeFormat
    );
    const formattedUpdatedAt = new Date(brand.updatedAt).toLocaleString(
      "en-GB",
      timeFormat
    );

    const formattedbrand = {
      ...brand,
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
    };

    res.status(200).json(formattedbrand);
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchForClient = asyncHandler(async (req, res) => {
  const { brandId, page = 1, limit = 10, sortBy, order } = req.body;

  try {
    const filters = {};

    let orderBy;

    if (sortBy === "sellPrice") {
      orderBy = { sellPrice: order === "asc" ? "asc" : "desc" };
    } else {
      orderBy = { updatedAt: "desc" };
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        Products: {
          where: {
            ...filters,
            stock: { gt: 0 },
            isActive: true,
            Category: { isActive: true },
            SubCategory: { isActive: true },
          },
          orderBy: orderBy,
          take: limit,
          skip: (page - 1) * limit,
          select: {
            id: true,
            barcode: true,
            nameTm: true,
            nameRu: true,
            sellPrice: true,
            stock: true,
            orderLimit: true,
            images: true,
            Status: true,
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ message: "Бренд не найден." });
    }

    const totalProducts = await prisma.product.count({
      where: { brandId: brandId, stock: { gt: 0 } },
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const formattedCreatedAt = new Date(brand.createdAt).toLocaleString(
      "en-GB",
      timeFormat
    );
    const formattedUpdatedAt = new Date(brand.updatedAt).toLocaleString(
      "en-GB",
      timeFormat
    );

    const formattedbrand = {
      ...brand,
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
    };

    res.status(200).json({
      brand: formattedbrand,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newBrand = asyncHandler(async (req, res) => {
  const { name, discountType, discountValue, isActive } = req.body;

  try {
    let image = "";

    if (req.file) {
      const ext = extname(req.file.originalname);
      const filename = `brand_${Date.now()}${ext}`;
      image = await optimizeAndSaveImage(req.file.buffer, filename);
    }

    await prisma.brand.create({
      data: {
        name,
        discountType,
        discountValue: Number(discountValue),
        image: image,
        isActive: JSON.parse(isActive) || true,
      },
    });

    res.status(201).json({ message: "Бренд успешно создан." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании бренда.");
  }
});

const updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, discountType, discountValue, isActive } = req.body;

  try {
    const existingbrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingbrand) {
      return res.status(404).json({ message: "Бренд не найден." });
    }

    let image = existingbrand.image;

    if (req.file) {
      const ext = extname(req.file.originalname);
      const filename = `brand_${Date.now()}${ext}`;
      image = await optimizeAndSaveImage(req.file.buffer, filename);
    }

    const updatedbrandData = {
      name: name || existingbrand.name,
      discountType: discountType || existingbrand.discountType,
      discountValue: Number(discountValue) || existingbrand.discountValue,
      image: image,
      isActive: JSON.parse(isActive),
    };

    await prisma.brand.update({
      where: { id },
      data: updatedbrandData,
    });

    await prisma.product.updateMany({
      where: { brandId: id },
      data: { isActive: JSON.parse(isActive) },
    });

    return res.status(201).json({ message: "Бренд обновлен." });
  } catch (err) {
    res.status(500).send("Ошибка при обновлении бренда.");
  }
});

const deletebrand = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const brand = await prisma.brand.delete({
      where: { id },
    });
    return brand
      ? res.json({ message: "Бренд удален." })
      : res.status(404).json({ message: "Бренд не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при удалении бренда.");
  }
});

router.get("/fetch/all/", fetchAll);
router.post("/fetch/admin/", fetchBrands);
router.get("/fetch/client/", sendBrandsToClient);
router.get("/fetch/single/:id", fetchById);
router.post("/fetch/client/", fetchForClient);
router.post("/new/", upload.single("image"), newBrand);
router.patch("/update/:id", upload.single("image"), updateBrand);
router.delete("/delete/:id", deletebrand);

export default router;
