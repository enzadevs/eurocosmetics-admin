import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getAllImages = asyncHandler(async (req, res) => {
  try {
    const images = await prisma.product.findMany({
      where: {
        AND: [
          { imageOne: { not: null } },
          { imageOne: { not: "" } },
          {
            NOT: {
              OR: [
                { imageOne: { endsWith: ".jpg" } },
                { imageOne: { endsWith: ".JPG" } },
                { imageOne: { endsWith: ".jpeg" } },
                { imageOne: { endsWith: ".JPEG" } },
                { imageOne: { endsWith: ".png" } },
                { imageOne: { endsWith: ".PNG" } },
                { imageOne: { endsWith: ".webp" } },
                { imageOne: { endsWith: ".WEBP" } },
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        imageOne: true,
      },
    });

    res.status(200).json(images);
  } catch (err) {
    console.error(`Error fetching images`, err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

const updateImagePaths = asyncHandler(async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        AND: [{ imageOne: { not: null } }, { imageOne: { not: "" } }],
      },
      select: {
        id: true,
        imageOne: true,
      },
    });

    const uploadsDir = path.join(__dirname, "../../uploads/products");
    const files = await fs.readdir(uploadsDir);

    const fileMap = new Map();
    files.forEach((file) => {
      const nameWithoutExt = path.parse(file).name;
      fileMap.set(nameWithoutExt, file);
    });

    const updates = [];
    const BATCH_SIZE = 1000;
    let updatedCount = 0;

    for (const product of products) {
      if (!product.imageOne) continue;

      const currentFileName = product.imageOne.split("/").pop();
      const nameWithoutExt = path.parse(currentFileName).name;
      const actualFile = fileMap.get(nameWithoutExt);

      if (actualFile && actualFile !== currentFileName) {
        updates.push(
          prisma.product.update({
            where: { id: product.id },
            data: {
              imageOne: `uploads/products/${actualFile}`,
            },
          })
        );

        if (updates.length >= BATCH_SIZE) {
          await prisma.$transaction(updates);
          updatedCount += updates.length;
          updates.length = 0;
        }
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
      updatedCount += updates.length;
    }

    res.status(200).json({
      message: `Successfully updated ${updatedCount} image paths`,
      updatedCount,
    });
  } catch (err) {
    console.error(`Error updating image paths`, err);
    res.status(500).json({ error: "Failed to update image paths" });
  }
});

const insertProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  const BATCH_SIZE = 1000;

  let insertedCount = 0;
  let errorCount = 0;

  const decodeHtmlEntities = (text) => {
    return text.replace(/\\&quot;/g, '"').replace(/&quot;/g, '"');
  };

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, Math.min(i + BATCH_SIZE, products.length));
    const mappedProducts = batch.map((product) => ({
      barcode: product?.barcode || "",
      nameTm: decodeHtmlEntities(product?.name_tm || ""),
      nameRu: decodeHtmlEntities(product?.name_ru || ""),
      currentSellPrice: parseFloat(product?.price) || 0,
      stock: parseFloat(product?.stock || 0).toFixed(2),
      imageOne: product?.product_id
        ? `uploads/products/${product.product_id}`
        : "",
    }));

    try {
      const result = await prisma.product.createMany({
        data: mappedProducts,
        skipDuplicates: true,
      });
      insertedCount += result.count;
    } catch (err) {
      console.error(`Error in batch starting at index ${i}:`, err);
      errorCount += batch.length;
    }
  }

  res.status(200).json({
    message: `Successfully added ${insertedCount} products. ${errorCount} products failed to insert.`,
  });
});

const exportProducts = asyncHandler(async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        barcode: true,
        nameRu: true,
        incomePrice: true,
        currentSellPrice: true,
        stock: true,
      },
    });

    res.status(200).json(products);
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const syncProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  const BATCH_SIZE = 500;

  try {
    const productBarcodes = products
      .map((product) => product.barcode)
      .filter((barcode) => barcode !== undefined && barcode !== null);

    if (productBarcodes.length === 0) {
      return res.status(400).send({
        message: `Нет действительных штрих-кодов для синхронизации.`,
        failedProducts: products.map((p) => ({
          barcode: p.barcode,
          incomePrice: p.incomePrice,
          currentSellPrice: p.currentSellPrice,
          reason: "Неправильный баркод",
        })),
      });
    }

    const existingProducts = await prisma.product.findMany({
      where: {
        barcode: {
          in: productBarcodes,
          mode: "insensitive",
        },
      },
    });

    const existingBarcodesMap = new Map(
      existingProducts.map((product) => [
        product.barcode.toLowerCase(),
        product.barcode,
      ])
    );

    const productsToUpdate = [];
    const failedProducts = [];

    for (const product of products) {
      if (!product.barcode) {
        failedProducts.push({
          barcode: product.barcode,
          nameRu: product.nameRu,
          incomePrice: product.incomePrice,
          currentSellPrice: product.currentSellPrice,
          reason: "Отсутствует баркод",
        });
        continue;
      }

      if (!existingBarcodesMap.has(product.barcode.toLowerCase())) {
        failedProducts.push({
          barcode: product.barcode,
          nameRu: product.nameRu,
          incomePrice: product.incomePrice,
          currentSellPrice: product.currentSellPrice,
          reason: "Товар не был найден на базе данных",
        });
        continue;
      }

      const updatedProduct = { ...product };
      if (updatedProduct.stock < 0) {
        updatedProduct.stock = 0;
      }

      const dataToUpdate = {};
      if (updatedProduct.stock !== undefined) {
        dataToUpdate.stock = updatedProduct.stock;
      }
      if (updatedProduct.incomePrice !== undefined) {
        dataToUpdate.incomePrice = updatedProduct.incomePrice;
      }
      if (updatedProduct.currentSellPrice !== undefined) {
        dataToUpdate.currentSellPrice = updatedProduct.currentSellPrice;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        productsToUpdate.push({
          barcode: existingBarcodesMap.get(
            updatedProduct.barcode.toLowerCase()
          ),
          data: dataToUpdate,
        });
      } else {
        failedProducts.push({
          barcode: product.barcode,
          product: product.nameRu,
          incomePrice: product.incomePrice,
          currentSellPrice: product.currentSellPrice,
          reason: "No valid fields to update",
        });
      }
    }

    for (let i = 0; i < productsToUpdate.length; i += BATCH_SIZE) {
      const batch = productsToUpdate.slice(i, i + BATCH_SIZE);
      const updatePromises = batch.map(({ barcode, data }) => {
        return prisma.product.update({
          where: { barcode },
          data: { ...data },
        });
      });

      try {
        await prisma.$transaction(updatePromises);
      } catch (error) {
        batch.forEach(({ barcode }) => {
          const originalProduct = products.find(
            (p) => p.barcode.toLowerCase() === barcode.toLowerCase()
          );
          failedProducts.push({
            barcode,
            nameRu: originalProduct.nameRu,
            incomePrice: originalProduct?.incomePrice,
            currentSellPrice: originalProduct?.currentSellPrice,
            reason: "Ошибка в базе данных",
          });
        });
      }
    }

    res.status(200).send({
      message: `Синхронизация завершена: обновлено ${productsToUpdate.length} товаров. Не удалось обновить ${failedProducts.length} товаров.`,
      failedProducts: failedProducts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Ошибка при синхронизации данных.",
      failedProducts: products.map((p) => ({
        barcode: p.barcode,
        nameRu: p.nameRu,
        incomePrice: p.incomePrice,
        currentSellPrice: p.currentSellPrice,
        reason: "Server error",
      })),
    });
  }
});

const insertCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  const BATCH_SIZE = 1000;

  let insertedCount = 0;
  let errorCount = 0;

  const decodeHtmlEntities = (text) => {
    return text.replace(/\\&quot;/g, '"').replace(/&quot;/g, '"');
  };

  for (let i = 0; i < categories.length; i += BATCH_SIZE) {
    const batch = categories.slice(
      i,
      Math.min(i + BATCH_SIZE, categories.length)
    );
    const mappedCategories = batch.map((item) => ({
      nameTm: decodeHtmlEntities(item?.name_tm || ""),
      nameRu: decodeHtmlEntities(item?.name_ru || ""),
      categoryId: "a7169a1e-ad22-4072-9e6c-e29810167a41",
    }));

    try {
      const result = await prisma.subCategory.createMany({
        data: mappedCategories,
        skipDuplicates: true,
      });
      insertedCount += result.count;
    } catch (err) {
      console.error(`Error in batch starting at index ${i}:`, err);
      errorCount += batch.length;
    }
  }

  res.status(200).json({
    message: `Successfully added ${insertedCount} categories. ${errorCount} categories failed to insert.`,
  });
});

router.get("/export", exportProducts);
router.put("/insert", insertProducts);
router.put("/products", syncProducts);
router.get("/getimages", getAllImages);
router.post("/updateimages", updateImagePaths);

export default router;
