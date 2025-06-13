import express from "express";
import multer from "multer";
import sharp from "sharp";
import { extname, join } from "path";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "imageOne", maxCount: 1 },
  { name: "imageTwo", maxCount: 1 },
  { name: "imageThree", maxCount: 1 },
  { name: "imageFour", maxCount: 1 },
  { name: "imageFive", maxCount: 1 },
]);

const optimizeAndSaveImage = async (buffer, filename) => {
  const optimizedImagePath = join("uploads/products/", filename);
  await sharp(buffer, { failOnError: false })
    .resize(600)
    .jpeg({ quality: 97 })
    .toFile(optimizedImagePath);
  return optimizedImagePath;
};

const fetchProductsByFilters = asyncHandler(async (req, res) => {
  const {
    query = "",
    page = 1,
    limit = 20,
    brandId,
    categoryId,
    subCategoryId,
    segmentId,
    productStatusId,
    unit,
    minPrice,
    maxPrice,
    sortBy,
    order,
  } = req.body;

  try {
    const filters = {};

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (brandId) {
      filters.brandId = brandId;
    }

    if (productStatusId) {
      filters.productStatusId = Number(productStatusId);
    }

    if (subCategoryId) {
      filters.subCategoryId = subCategoryId;
    }

    if (segmentId) {
      filters.segmentId = segmentId;
    }

    if (unit) {
      filters.unit = unit;
    }

    if (minPrice) {
      filters.currentSellPrice = {
        ...filters.currentSellPrice,
        gte: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      filters.currentSellPrice = {
        ...filters.currentSellPrice,
        lte: parseFloat(maxPrice),
      };
    }

    // let orderBy;

    // if (sortBy === "currentSellPrice") {
    //   orderBy = { currentSellPrice: order === "desc" ? "desc" : "asc" };
    // } else if (sortBy === "stock") {
    //   orderBy = { stock: order === "desc" ? "desc" : "asc" };
    // } else {
    //   orderBy = { updatedAt: "desc" };
    // }

    let orderBy = [];

    orderBy.push({ subCategoryId: { sort: "asc", nulls: "first" } });

    if (sortBy === "currentSellPrice") {
      orderBy.push({ currentSellPrice: order === "desc" ? "desc" : "asc" });
    } else if (sortBy === "stock") {
      orderBy.push({ stock: order === "desc" ? "desc" : "asc" });
    } else {
      orderBy.push({ updatedAt: "desc" });
    }

    const allProductsCount = await prisma.product.count();

    const productCount = await prisma.product.count({
      where: {
        ...filters,
        OR: [
          { nameTm: { contains: query, mode: "insensitive" } },
          { nameRu: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { hashtags: { has: query } },
          { nameTm: { startsWith: query.slice(0, 3), mode: "insensitive" } },
          { nameRu: { startsWith: query.slice(0, 3), mode: "insensitive" } },
        ],
      },
    });

    const totalPages = Math.ceil(productCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const products = await prisma.product.findMany({
      where: {
        ...filters,
        OR: [
          { nameTm: { contains: query, mode: "insensitive" } },
          { nameRu: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { hashtags: { has: query } },
          { nameTm: { startsWith: query.slice(0, 3), mode: "insensitive" } },
          { nameRu: { startsWith: query.slice(0, 3), mode: "insensitive" } },
        ],
      },
      take: limit,
      skip: (currentPage - 1) * limit,
      orderBy: orderBy,
      select: {
        barcode: true,
        order: true,
        nameRu: true,
        currentSellPrice: true,
        stock: true,
        imageOne: true,
        isActive: true,
        unit: true,
        Brand: {
          select: {
            name: true,
          },
        },
        SubCategory: {
          select: {
            nameRu: true,
          },
        },
        createdAt: true,
      },
    });

    const formattedProducts = products.map((product) => ({
      ...product,
      createdAt: new Date(product.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      ),
    }));

    if (formattedProducts.length === 0) {
      return res.status(404).json({ message: "Товары не были найдены." });
    }

    res.status(200).json({
      products: formattedProducts,
      allProductsCount: allProductsCount,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchProductsForClient = asyncHandler(async (req, res) => {
  const {
    query = "",
    page = 1,
    limit = 10,
    sortBy,
    order,
    hasDiscount,
    brandId,
    categoryId,
    subCategoryId,
    segmentId,
    productStatusId,
    unit,
    minPrice,
    maxPrice,
  } = req.body;

  try {
    const filters = {};

    if (categoryId) {
      filters.categoryId = categoryId;
    }

    if (brandId) {
      filters.brandId = brandId;
    }

    if (productStatusId) {
      filters.productStatusId = productStatusId;
    }

    if (subCategoryId) {
      filters.subCategoryId = subCategoryId;
    }

    if (segmentId) {
      filters.segmentId = segmentId;
    }

    if (unit) {
      filters.unit = unit;
    }

    if (minPrice) {
      filters.currentSellPrice = {
        ...filters.currentSellPrice,
        gte: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      filters.currentSellPrice = {
        ...filters.currentSellPrice,
        lte: parseFloat(maxPrice),
      };
    }

    if (hasDiscount) {
      filters.discountValue = { gt: 0 };
    }

    let orderBy = [
      { order: "asc" },
      { currentSellPrice: "asc" },
      { id: "asc" },
    ];

    if (sortBy) {
      if (sortBy === "currentSellPrice") {
        orderBy = [
          { currentSellPrice: order === "asc" ? "asc" : "desc" },
          { id: "asc" },
        ];
      } else {
        orderBy = [
          { [sortBy]: order === "asc" ? "asc" : "desc" },
          { id: "asc" },
        ];
      }
    }

    const productCount = await prisma.product.count({
      where: {
        ...filters,
        stock: { gt: 0 },
        currentSellPrice: { gt: 0 },
        isActive: true,
        OR: [
          { nameTm: { contains: query, mode: "insensitive" } },
          { nameRu: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { hashtags: { has: query } },
          { nameTm: { startsWith: query.slice(0, 3), mode: "insensitive" } },
          { nameRu: { startsWith: query.slice(0, 3), mode: "insensitive" } },
        ],
      },
    });

    const totalPages = Math.ceil(productCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const products = await prisma.product.findMany({
      where: {
        ...filters,
        stock: { gt: 0 },
        currentSellPrice: { gt: 0 },
        isActive: true,
        OR: [
          { nameTm: { contains: query, mode: "insensitive" } },
          { nameRu: { contains: query, mode: "insensitive" } },
          { barcode: { contains: query, mode: "insensitive" } },
          { hashtags: { has: query } },
          { nameTm: { startsWith: query.slice(0, 3), mode: "insensitive" } },
          { nameRu: { startsWith: query.slice(0, 3), mode: "insensitive" } },
        ],
      },
      take: limit,
      skip: (currentPage - 1) * limit,
      orderBy: orderBy,
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
        Category: {
          select: {
            id: true,
            nameRu: true,
            nameTm: true,
          },
        },
        SubCategory: {
          select: {
            id: true,
            nameRu: true,
            nameTm: true,
          },
        },
        Segment: {
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

    if (products.length === 0) {
      return res.status(404).json({ message: "Товары не были найдены." });
    }

    res.status(200).json({
      products: products,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchMostSoldProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.body;
  const skip = (page - 1) * limit;

  try {
    const totalProductsCount = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
    });

    const totalPages = Math.ceil(totalProductsCount.length / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const products = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
      skip: skip,
    });

    const productDetails = await Promise.all(
      products.map(async (item) => {
        if (item.productBarcode) {
          const product = await prisma.product.findUnique({
            where: {
              barcode: item.productBarcode,
              stock: { gt: 0 },
              currentSellPrice: { gt: 0 },
            },
            select: {
              barcode: true,
              nameTm: true,
              nameRu: true,
              sellPrice: true,
              currentSellPrice: true,
              discountType: true,
              discountValue: true,
              descriptionTm: true,
              descriptionRu: true,
              unit: true,
              Status: true,
              stock: true,
              imageOne: true,
              imageTwo: true,
              imageThree: true,
              imageFour: true,
              imageFive: true,
              isActive: true,
              limit: true,
              Reviews: {
                where: { isActive: true },
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  reply: true,
                  Customer: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
              Brand: {
                select: {
                  name: true,
                },
              },
            },
          });

          return product
            ? { ...product, quantitySold: item._sum.quantity }
            : null;
        }
        return null;
      })
    );

    const filteredProductDetails = productDetails.filter(
      (item) => item !== null
    );

    res.status(200).json({
      products: filteredProductDetails,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching data." });
  }
});

const fetchProductInfoByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        Status: true,
        Brand: true,
        Category: true,
        SubCategory: true,
        Segment: true,
        Reviews: {
          include: {
            Customer: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Товар не найден." });
    }

    const formattedCreatedAt = new Date(product.createdAt).toLocaleString(
      "en-GB",
      timeFormat
    );
    const formattedUpdatedAt = new Date(product.updatedAt).toLocaleString(
      "en-GB",
      timeFormat
    );

    const formattedProduct = {
      ...product,
      createdAt: formattedCreatedAt,
      updatedAt: formattedUpdatedAt,
    };

    res.status(200).json(formattedProduct);
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const fetchProductForAdmin = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: {
        Status: true,
        Category: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        SubCategory: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        Segment: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderItem: {
          orderBy: { id: "desc" },
          take: 100,
          select: {
            orderId: true,
            quantity: true,
            currentSellPrice: true,
            Order: {
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Товар не найден." });
    }

    const productWithOrders = {
      ...product,
      relatedOrders: product.OrderItem.map((orderItem) => orderItem.Order),
    };

    res.status(200).json(productWithOrders);
  } catch (err) {
    console.error("Error fetching product with orders:", err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newProduct = asyncHandler(async (req, res) => {
  const {
    barcode,
    nameTm,
    nameRu,
    order,
    incomePrice,
    sellPrice,
    discountType,
    discountValue,
    currentSellPrice,
    unit,
    stock,
    productStatusId,
    descriptionTm,
    descriptionRu,
    limit,
    isActive,
    hashtags,
    categoryId,
    subCategoryId,
    segmentId,
  } = req.body;

  try {
    const imageFields = [
      "imageOne",
      "imageTwo",
      "imageThree",
      "imageFour",
      "imageFive",
    ];
    const images = await Promise.all(
      imageFields.map(async (fieldName) => {
        if (req.files && req.files[fieldName]) {
          const file = req.files[fieldName][0];
          const fileExtension = extname(file.originalname);
          const filename = `${Date.now()}-${fieldName}${fileExtension}`;
          return await optimizeAndSaveImage(file.buffer, filename);
        }
        return undefined;
      })
    );

    const [imageOne, imageTwo, imageThree, imageFour, imageFive] = images;

    let productData = {
      barcode,
      nameTm,
      nameRu,
      order: Number(order),
      incomePrice: parseFloat(incomePrice).toFixed(2),
      sellPrice: parseFloat(sellPrice).toFixed(2),
      discountType:
        discountType && ["FIXED", "PERCENTAGE"].includes(discountType)
          ? discountType
          : null,
      discountValue: Number(discountValue),
      currentSellPrice: parseFloat(currentSellPrice).toFixed(2),
      unit: unit && ["Piece", "Kg", "Litre"].includes(unit) ? unit : "Piece",
      stock: parseFloat(stock),
      Status: {
        connect: { id: Number(productStatusId) },
      },
      descriptionTm,
      descriptionRu,
      limit: Number(limit),
      isActive: JSON.parse(isActive),
      Category: {
        connect: { id: categoryId },
      },
      imageOne,
      imageTwo,
      imageThree,
      imageFour,
      imageFive,
    };

    if (subCategoryId !== "null") {
      productData.SubCategory = {
        connect: { id: subCategoryId },
      };
    }

    if (segmentId !== "null") {
      productData.Segment = {
        connect: { id: segmentId },
      };
    }

    if (hashtags) {
      productData.hashtags =
        typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
    }

    await prisma.product.create({
      data: productData,
    });

    res.status(201).json({
      message: "Товар успешно создан.",
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Товар с таким баркодом уже существует.",
      });
    } else {
      console.log(err);
      res.status(500).json({ message: "Ошибка при создании товара." });
    }
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const {
    newBarcode,
    nameTm,
    nameRu,
    order,
    incomePrice,
    sellPrice,
    discountType,
    discountValue,
    currentSellPrice,
    unit,
    stock,
    productStatusId,
    descriptionTm,
    descriptionRu,
    limit,
    isActive,
    hashtags,
    categoryId,
    subCategoryId,
    segmentId,
    waitListCount,
  } = req.body;

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { barcode },
      include: {
        Status: true,
        Brand: true,
        Category: true,
        SubCategory: true,
        Segment: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Товар не был найден.",
      });
    }

    const imageFields = [
      "imageOne",
      "imageTwo",
      "imageThree",
      "imageFour",
      "imageFive",
    ];

    const images = req.files
      ? await Promise.all(
          imageFields.map(async (fieldName) => {
            if (req.files && req.files[fieldName]) {
              const file = req.files[fieldName][0];
              const fileExtension = extname(file.originalname);
              const filename = `${Date.now()}-${fieldName}${fileExtension}`;
              const optimizedImagePath = await optimizeAndSaveImage(
                file.buffer,
                filename
              );
              return optimizedImagePath;
            }
            return undefined;
          })
        )
      : [];

    const updatedProductData = {
      barcode: newBarcode || existingProduct.barcode,
      nameRu: nameRu || existingProduct.nameRu,
      nameTm: nameTm || existingProduct.nameTm,
      order: Number(order) || existingProduct.order,
      incomePrice:
        parseFloat(incomePrice).toFixed(2) || existingProduct.incomePrice,
      sellPrice: parseFloat(sellPrice).toFixed(2) || existingProduct.sellPrice,
      discountType:
        discountType && ["FIXED", "PERCENTAGE"].includes(discountType)
          ? discountType
          : null,
      discountValue: Number(discountValue) ?? existingProduct.discountValue,
      currentSellPrice:
        parseFloat(currentSellPrice).toFixed(2) ||
        existingProduct.currentSellPrice,
      unit: unit && ["Piece", "Kg", "Litre"].includes(unit) ? unit : "Piece",
      stock: parseFloat(stock).toFixed(2) || existingProduct.stock,
      Status: {
        connect: {
          id: Number(productStatusId) || existingProduct.productStatusId,
        },
      },
      descriptionTm: descriptionTm || existingProduct.descriptionTm,
      descriptionRu: descriptionRu || existingProduct.descriptionRu,
      limit:
        limit !== undefined && limit !== null && limit !== ""
          ? Number(limit)
          : existingProduct.limit,
      isActive: JSON.parse(isActive),
      Category: {
        connect: { id: categoryId || existingProduct.categoryId },
      },
      imageOne: images[0] !== undefined ? images[0] : existingProduct.imageOne,
      imageTwo: images[1] !== undefined ? images[1] : existingProduct.imageTwo,
      imageThree:
        images[2] !== undefined ? images[2] : existingProduct.imageThree,
      imageFour:
        images[3] !== undefined ? images[3] : existingProduct.imageFour,
      imageFive:
        images[4] !== undefined ? images[4] : existingProduct.imageFive,
      hashtags: hashtags ? JSON.parse(hashtags) : existingProduct.hashtags,
      waitListCount: Number(waitListCount) || existingProduct.waitListCount,
    };

    if (subCategoryId?.length > 10) {
      updatedProductData.SubCategory = {
        connect: { id: subCategoryId },
      };
    }

    if (segmentId?.length > 10) {
      updatedProductData.Segment = {
        connect: { id: segmentId },
      };
    }

    await prisma.product.update({
      where: { barcode },
      data: updatedProductData,
    });

    res.status(200).json({
      message: "Товар успешно обновлен.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при обновлении товара." });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    await prisma.product.delete({
      where: { barcode },
    });

    res.status(200).json({ message: "Товар удален." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Товар не найден." });
    } else {
      console.log(error);
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении товара." });
    }
  }
});

const deleteProductBody = asyncHandler(async (req, res) => {
  const { barcode } = req.body;

  try {
    await prisma.product.delete({
      where: { barcode },
    });

    res.status(200).json({ message: "Товар удален." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Товар не найден." });
    } else {
      console.log(error);
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении товара." });
    }
  }
});

const fetchLatestProductData = asyncHandler(async (req, res) => {
  const { products } = req.body;

  const barcodes = [...new Set(products.map((product) => product.barcode))];

  try {
    const products = await prisma.product.findMany({
      where: {
        barcode: { in: barcodes },
      },
      select: {
        barcode: true,
        nameTm: true,
        nameRu: true,
        sellPrice: true,
        currentSellPrice: true,
        discountType: true,
        discountValue: true,
        descriptionTm: true,
        descriptionRu: true,
        unit: true,
        stock: true,
        imageOne: true,
        isActive: true,
        limit: true,
        Category: {
          select: {
            id: true,
            deliveryPrice: true,
            nameRu: true,
            nameTm: true,
          },
        },
      },
    });

    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching product data." });
  }
});

const updateProductStock = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const { stock } = req.body;

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { barcode },
      select: {
        stock: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Товар не был найден.",
      });
    }

    const updatedProductData = {
      stock: parseFloat(stock).toFixed(2) || existingProduct.stock,
    };

    await prisma.product.update({
      where: { barcode },
      data: updatedProductData,
    });

    res.status(200).json({
      message: "Количество обновлено.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при обновлении количества." });
  }
});

router.post("/all", fetchProductsByFilters);
router.post("/client", fetchProductsForClient);
router.post("/popular", fetchMostSoldProducts);
router.get("/admin/:barcode", fetchProductForAdmin);
router.get("/barcode/:barcode", fetchProductInfoByBarcode);
router.post("/new/", upload, newProduct);
router.patch("/update/:barcode", upload, updateProduct);
router.patch("/stock/:barcode", updateProductStock);
router.delete("/deletebody/", deleteProductBody);
router.delete("/delete/:barcode", deleteProduct);
router.post("/latestdata", fetchLatestProductData);

export default router;
