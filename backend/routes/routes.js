import express from "express";
const router = express.Router();

// ? Product routes
import productsRouter from "./manage/products.js";
import brandsRouter from "./manage/brands.js";
import categoriesRouter from "./manage/categories.js";
import subCategoriesRouter from "./manage/subcategories.js";
import segmentsRouter from "./manage/segments.js";
import statusesRouter from "./manage/product_statuses.js";

router.use("/products", productsRouter);
router.use("/brands", brandsRouter);
router.use("/categories", categoriesRouter);
router.use("/subcategories", subCategoriesRouter);
router.use("/segments", segmentsRouter);
router.use("/statuses", statusesRouter);

// ? Ordering routes
import ordersRouter from "./actions/orders.js";
import orderCityRouter from "./manage/order_city.js";
import orderTimesRouter from "./manage/order_time.js";
import paymentTypesRouter from "./manage/payment_types.js";
import deliveryTypesRouter from "./manage/delivery_types.js";
import orderStatusesRouter from "./manage/order_status.js";

router.use("/orders", ordersRouter);
router.use("/cities", orderCityRouter);
router.use("/ordertimes", orderTimesRouter);
router.use("/paymenttypes", paymentTypesRouter);
router.use("/deliverytypes", deliveryTypesRouter);
router.use("/orderstatuses", orderStatusesRouter);

// ? Other routes
import actionsRouter from "./actions/actions.js";
import popUpRouter from "./manage/popup.js";
import bannersRouter from "./manage/banners.js";
import settingsRouter from "./manage/settings.js";
import analyticsRouter from "./actions/analytics.js";
import syncRouter from "./actions/sync.js";
import pushNotificationsRouter from "./actions/push.js";
import uploadsRouter from "./images.js";
router.use("/actions", actionsRouter);
router.use("/popup", popUpRouter);
router.use("/banners", bannersRouter);
router.use("/settings", settingsRouter);
router.use("/analytics", analyticsRouter);
router.use("/synchronize", syncRouter);
router.use("/push", pushNotificationsRouter);
router.use("/uploads/", uploadsRouter);

// ? User routes
import usersRouter from "./user/user.js";
import customerRouter from "./user/customer.js";
import visitorsRouter from "./user/visitors.js";
router.use("/admin", usersRouter);
router.use("/customer", customerRouter);
router.use("/visitor", visitorsRouter);

router.get("/", (req, res) => {
  res.send("API root");
});

router.get("*", (req, res) => {
  res.status(404).json({ message: "Путь не найден." });
});

export default router;
