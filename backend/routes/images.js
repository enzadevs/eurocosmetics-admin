import path from "path";
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const productsPath = path.join(__dirname, "../uploads/products");
const popUpPath = path.join(__dirname, "../uploads/popup");
const brandsPath = path.join(__dirname, "../uploads/brands");
const bannersPath = path.join(__dirname, "../uploads/banner");
const storiesPath = path.join(__dirname, "../uploads/stories");
const categoriesPath = path.join(__dirname, "../uploads/categories");
const subCategoriesPath = path.join(__dirname, "../uploads/subcategories");
const segmentsPath = path.join(__dirname, "../uploads/segments");

router.use("/popup/", express.static(popUpPath));
router.use("/banner/", express.static(bannersPath));
router.use("/stories/", express.static(storiesPath));
router.use("/brands/", express.static(brandsPath));
router.use("/products/", express.static(productsPath));
router.use("/categories/", express.static(categoriesPath));
router.use("/subcategories/", express.static(subCategoriesPath));
router.use("/segments/", express.static(segmentsPath));

export default router;
