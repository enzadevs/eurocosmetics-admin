import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();

const canReviewProduct = asyncHandler(async (req, res) => {
  const { customerId, barcode } = req.body;

  try {
    const purchaseRecord = await prisma.orderItem.findFirst({
      where: {
        productBarcode: barcode,
        Order: {
          orderStatusId: 3,
          customerId: customerId,
        },
      },
    });

    const existingReview = await prisma.review.findUnique({
      where: {
        customerId_productBarcode: {
          customerId: customerId,
          productBarcode: barcode,
        },
      },
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "Вы уже оставили свой отзыв на этот товар." });
    }

    if (purchaseRecord) {
      return res.status(200).json({ canReviewProduct: true });
    } else {
      return res.status(403).json({
        canReviewProduct: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const canReviewMarket = asyncHandler(async (req, res) => {
  const { customerId } = req.body;

  try {
    const purchaseRecord = await prisma.orderItem.findFirst({
      where: {
        Order: {
          orderStatusId: 3,
          customerId: customerId,
        },
      },
    });

    if (purchaseRecord) {
      return res.status(200).json({ canReviewMarket: true });
    } else {
      return res.status(403).json({
        canReviewMarket: false,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

// * Product Reviews
const createProductReview = asyncHandler(async (req, res) => {
  const { customerId, barcode, rating, comment } = req.body;

  try {
    const product = await prisma.product.findUnique({
      where: { barcode: barcode },
    });

    if (!product) {
      return res.status(404).json({ message: "Товар не найден." });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Клиент не найден." });
    }

    const newReview = await prisma.review.create({
      data: {
        customerId: customerId,
        productBarcode: barcode,
        rating,
        comment,
      },
    });

    res.status(201).json({
      message: "Отзыв создан.",
      review: newReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const updateProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment, reply, isActive } = req.body;

  try {
    const review = await prisma.review.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!review) {
      return res.status(404).json({ message: "Отзыв не найден." });
    }

    const updatedReview = await prisma.review.update({
      where: {
        id: Number(id),
      },
      data: {
        rating:
          rating !== null && rating !== undefined ? rating : review.rating,
        comment:
          comment !== null && rating !== undefined ? comment : review.comment,
        reply: reply || null,
        isActive: JSON.parse(isActive),
      },
    });

    res.status(200).json({
      message: "Отзыв обновлен.",
      review: updatedReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const deleteProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!review) {
      res.status(404).json({ message: "Отзыв не был найден." });
    }

    await prisma.review.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({ message: "Отзыв удален." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const fetchAllProductReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "", sortBy = "createdAt" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [
            { comment: { contains: query, mode: "insensitive" } },
            { productBarcode: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const reviewsCount = await prisma.review.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(reviewsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const reviews = await prisma.review.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        [sortBy]: "desc",
      },
      include: {
        Product: {
          select: {
            imageOne: true,
            barcode: true,
            nameRu: true,
          },
        },
        Customer: {
          select: {
            username: true,
          },
        },
      },
    });

    const formattedReviews = reviews.map((review) => {
      const formattedCreatedAt = new Date(review.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...review,
        createdAt: formattedCreatedAt,
      };
    });

    res.status(200).json({
      reviews: formattedReviews,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while fetching reviews.");
  }
});

const fetchProductReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({
      where: { id: Number(id) },
      include: {
        Product: true,
        Customer: true,
      },
    });

    return review
      ? res.status(200).send(review)
      : res.status(404).json({ message: "Отзыв не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

// * Market Reviews
const createMarketReview = asyncHandler(async (req, res) => {
  const { customerId, rating, comment, ReviewType } = req.body;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Клиент не найден." });
    }

    const newReview = await prisma.marketReview.create({
      data: {
        customerId: customerId,
        rating,
        comment,
        ReviewType: ReviewType,
      },
    });

    res.status(201).json({
      message: "Отзыв создан.",
      review: newReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const updateMarketReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment, reply, isActive } = req.body;

  try {
    const review = await prisma.marketReview.findUnique({
      where: { id: Number(id) },
    });

    if (!review) {
      return res.status(404).json({ message: "Отзыв не найден." });
    }

    const updatedReview = await prisma.marketReview.update({
      where: {
        id: Number(id),
      },
      data: {
        rating:
          rating !== null && rating !== undefined ? rating : review.rating,
        comment:
          comment !== null && rating !== undefined ? comment : review.comment,
        reply: reply || null,
        isActive: JSON.parse(isActive),
      },
    });

    res.status(200).json({
      message: "Отзыв обновлен.",
      review: updatedReview,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const deleteMarketReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const review = await prisma.marketReview.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!review) {
      res.status(404).json({ message: "Отзыв не был найден." });
    }

    await prisma.marketReview.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({ message: "Отзыв удален." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const fetchAllMarketReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "", sortBy = "createdAt" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ comment: { contains: query, mode: "insensitive" } }],
        }
      : {};

    const reviewsCount = await prisma.marketReview.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(reviewsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const reviews = await prisma.marketReview.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        [sortBy]: "desc",
      },
      include: {
        Customer: {
          select: {
            username: true,
            phoneNumber: true,
          },
        },
      },
    });

    const formattedReviews = reviews.map((review) => {
      const formattedCreatedAt = new Date(review.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      const formattedUpdatedAt = new Date(review.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...review,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({
      reviews: formattedReviews,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while fetching reviews.");
  }
});

const fetchActiveMarketReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.body;

  try {
    const reviewsCount = await prisma.marketReview.count({
      where: {
        isActive: true,
      },
    });

    const totalPages = Math.ceil(reviewsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const reviews = await prisma.marketReview.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: {
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        Customer: {
          select: {
            username: true,
            phoneNumber: true,
          },
        },
      },
    });

    const formattedReviews = reviews.map((review) => {
      const formattedCreatedAt = new Date(review.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      const formattedUpdatedAt = new Date(review.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );
      return {
        ...review,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    const aggregatedReviews = await prisma.marketReview.aggregate({
      _avg: {
        rating: true,
      },
      where: {
        isActive: true,
      },
    });

    const averageRating = aggregatedReviews._avg.rating || 5;

    res.status(200).json({
      reviews: formattedReviews,
      averageRating: parseFloat(averageRating).toFixed(1),
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error while fetching reviews.");
  }
});

const fetchMarketReviewById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const review = await prisma.marketReview.findUnique({
      where: { id: Number(id) },
      include: {
        Customer: true,
      },
    });

    return review
      ? res.status(200).send(review)
      : res.status(404).json({ message: "Отзыв не найден." });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

// * Queries, Couriers and ActionLogs
const newSearchQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;

  try {
    const existingQuery = await prisma.searchQuery.findUnique({
      where: {
        query,
      },
    });

    if (existingQuery) {
      await prisma.searchQuery.update({
        where: { id: existingQuery.id },
        data: { count: existingQuery.count + 1 },
      });
      res.status(200).send("Query count updated.");
    } else {
      await prisma.searchQuery.create({
        data: {
          query,
          count: 1,
        },
      });
      res.status(201).send("New query created.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка.");
  }
});

const fetchQueries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = "" } = req.body;

  try {
    const whereClause = search
      ? {
          query: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const queryCount = await prisma.searchQuery.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(queryCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const queries = await prisma.searchQuery.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        count: "desc",
      },
    });

    res.status(200).json({
      queries,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const deleteQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const query = await prisma.searchQuery.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!query) {
      res.status(404).json({ message: "Запрос не найден." });
    }

    await prisma.searchQuery.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({ message: "Запрос удален." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const newCourier = asyncHandler(async (req, res) => {
  const { nameTm, nameRu } = req.body;

  try {
    await prisma.courierLang.create({
      data: { nameTm, nameRu },
    });

    res.status(201).json({ message: "Курьер создан." });
  } catch (err) {
    res.status(500).send("Ошибка при создании курьера.");
  }
});

const allCouriers = asyncHandler(async (req, res) => {
  try {
    const couriers = await prisma.courierLang.findMany();

    res.status(200).json({ couriers: couriers });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const newActionLog = asyncHandler(async (req, res) => {
  const { role, username, actionDescription, actionType } = req.body;

  try {
    await prisma.actionLogs.create({
      data: { role, username, actionDescription, actionType },
    });

    res.status(201).json({ message: "Событие создано." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при создании события.");
  }
});

const deleteActionLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const actionLog = await prisma.actionLogs.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!actionLog) {
      res.status(404).json({ message: "Событие не найдено." });
    }

    await prisma.actionLogs.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).json({ message: "Событие удалена." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Вышла серверная ошибка." });
  }
});

const fetchActionLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, query = "" } = req.body;

  try {
    const whereClause = query
      ? {
          OR: [{ actionDescription: { contains: query, mode: "insensitive" } }],
        }
      : {};

    const actionsCount = await prisma.actionLogs.count({
      where: whereClause,
    });

    const totalPages = Math.ceil(actionsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const actionLogs = await prisma.actionLogs.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedActionLogs = actionLogs.map((item) => {
      const formattedCreatedAt = new Date(item.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...item,
        createdAt: formattedCreatedAt,
      };
    });

    res.status(200).json({
      actions: formattedActionLogs,
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

// * OTP
const newOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    await prisma.oTP.create({
      data: {
        phone: phoneNumber,
        code: otpCode,
        message: `Ваш код подтверждения : ${otpCode}`,
        expiresAt: new Date(Date.now() + 1 * 60 * 1000),
      },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating OTP.");
  }
});

const checkOTPSignIn = asyncHandler(async (req, res) => {
  const { phoneNumber, code } = req.body;

  try {
    const otpRecord = await prisma.oTP.findFirst({
      where: { phone: phoneNumber, code: parseInt(code) },
    });

    if (!otpRecord) {
      return res
        .status(401)
        .json({ isCorrect: false, message: "Invalid OTP." });
    }

    if (Date.now() > otpRecord.expiresAt.getTime()) {
      await prisma.oTP.delete({
        where: { id: otpRecord.id },
      });

      return res
        .status(401)
        .json({ isCorrect: false, message: "OTP expired." });
    }

    await prisma.oTP.delete({
      where: { id: otpRecord.id },
    });

    const customer = await prisma.customer.findUnique({
      where: { phoneNumber: `+993${phoneNumber}` },
      select: {
        id: true,
        phoneNumber: true,
        username: true,
        pointsEarned: true,
        AddressOne: true,
        AddressTwo: true,
        AddressThree: true,
      },
    });

    res.status(200).json({ isCorrect: true, customer: customer });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error verifying OTP.");
  }
});

const checkOTPSignUp = asyncHandler(async (req, res) => {
  const { phoneNumber, code } = req.body;

  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phoneNumber: `+993${phoneNumber}`,
      },
    });

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: phoneNumber,
        code: parseInt(code),
      },
    });

    if (existingCustomer) {
      return res.status(401).json({
        isCorrect: false,
        message: "Этот номер телефона уже используется.",
      });
    }

    if (!otpRecord) {
      return res.status(401).json({
        isCorrect: false,
        message: "Неправильный код. Попробуйте снова.",
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(401).json({
        isCorrect: false,
        message: "Время ожидания вышло. Попробуйте снова.",
      });
    }

    await prisma.oTP.delete({
      where: { id: otpRecord.id },
    });

    const customer = await prisma.customer.create({
      data: {
        phoneNumber: `+993${phoneNumber}`,
      },
    });

    res.status(200).json({ isCorrect: true, customer: customer });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error verifying OTP.");
  }
});

const fetchAllOtps = asyncHandler(async (req, res) => {
  try {
    const oneMinuteAgo = new Date(Date.now() - 60000);

    const deletedOtps = await prisma.oTP.deleteMany({
      where: {
        expiresAt: {
          lt: oneMinuteAgo,
        },
      },
    });

    const otpArray = await prisma.oTP.findMany({
      select: {
        id: true,
        phone: true,
        message: true,
      },
    });

    const modifiedOtpArray = otpArray.map((otp) => ({
      ...otp,
      status: 0,
    }));

    res.status(200).json({ data: modifiedOtpArray });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

// * Waitlist Counter
const waitlistIncrement = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const currentWaitListCount = Number(product.waitListCount ?? 0);

    await prisma.product.update({
      where: { barcode },
      data: { waitListCount: currentWaitListCount + 1 },
    });

    res
      .status(200)
      .json({ success: true, message: "Waitlist count incremented" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error incrementing waitlist.");
  }
});

const waitlistDecrement = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { barcode },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const currentWaitListCount = Number(product.waitListCount ?? 0);

    if (currentWaitListCount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Waitlist count cannot be negative" });
    }

    await prisma.product.update({
      where: { barcode },
      data: { waitListCount: currentWaitListCount - 1 },
    });

    res
      .status(200)
      .json({ success: true, message: "Waitlist count decremented" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error decrementing waitlist.");
  }
});

const fetchProductsByWaitlist = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.body;

  try {
    const productsCount = await prisma.product.count({
      where: {
        waitListCount: { gte: 1 },
      },
    });

    const totalPages = Math.ceil(productsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const products = await prisma.product.findMany({
      skip: (currentPage - 1) * limit,
      take: limit,
      where: {
        waitListCount: { gte: 1 },
      },
      orderBy: {
        waitListCount: "desc",
      },
      select: {
        barcode: true,
        nameRu: true,
        currentSellPrice: true,
        stock: true,
        imageOne: true,
        isActive: true,
        waitListCount: true,
        unit: true,
        Brand: {
          select: {
            name: true,
          },
        },
        Category: {
          select: {
            nameRu: true,
          },
        },
      },
    });

    res.status(200).json({
      products,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching products.");
  }
});

router.post("/review/product", canReviewProduct);
router.post("/review/market", canReviewMarket);

router.post("/product/new", createProductReview);
router.patch("/product/update/:id", updateProductReview);
router.delete("/product/delete/:id", deleteProductReview);
router.post("/product/all", fetchAllProductReviews);
router.get("/product/fetch/:id", fetchProductReviewById);

router.post("/market/new", createMarketReview);
router.patch("/market/update/:id", updateMarketReview);
router.delete("/market/delete/:id", deleteMarketReview);
router.post("/market/all", fetchAllMarketReviews);
router.post("/market/active", fetchActiveMarketReviews);
router.get("/market/fetch/:id", fetchMarketReviewById);

router.post("/query/new", newSearchQuery);
router.post("/query/fetch", fetchQueries);
router.delete("/query/delete/:id", deleteQuery);

router.post("/courier/new", newCourier);
router.post("/courier/all", allCouriers);

router.post("/logs/new", newActionLog);
router.post("/logs/all", fetchActionLogs);
router.delete("/logs/delete/:id", deleteActionLog);

router.post("/otp/new", newOTP);
router.post("/otp/check/signin", checkOTPSignIn);
router.post("/otp/check/signup", checkOTPSignUp);
router.get("/otp/all", fetchAllOtps);

router.patch("/waitlist/inc/:barcode", waitlistIncrement);
router.patch("/waitlist/dec/:barcode", waitlistDecrement);
router.post("/waitlist/all", fetchProductsByWaitlist);

export default router;
