import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const fetchTodaysOrders = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const todaysOrders = await prisma.order.findMany({
      where: {
        orderStatusId: 3,
        createdAt: {
          gte: today,
        },
      },
      include: {
        OrderItems: {
          select: {
            quantity: true,
            Product: {
              select: {
                currentSellPrice: true,
              },
            },
          },
        },
      },
    });

    const ordersCount = todaysOrders.length;
    let overallSum = 0;

    todaysOrders.forEach((order) => {
      order.OrderItems.forEach((item) => {
        if (item.Product && item.Product.currentSellPrice) {
          overallSum +=
            Number(item.quantity) * Number(item.Product.currentSellPrice);
        }
      });
    });

    res.status(200).json({ ordersCount, overallSum });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const fetchTodaysRevenue = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const todaysOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
        },
        orderStatusId: 3,
      },
      include: {
        OrderItems: {
          select: {
            quantity: true,
            Product: {
              select: {
                currentSellPrice: true,
                incomePrice: true,
              },
            },
          },
        },
      },
    });

    const totalRevenue = todaysOrders.reduce((acc, order) => {
      return (
        acc +
        order.OrderItems.reduce((subAcc, orderItem) => {
          const sellPrice = orderItem.Product?.currentSellPrice;
          const incomePrice = orderItem.Product?.incomePrice;

          if (sellPrice !== undefined && incomePrice !== undefined) {
            const revenueDifference =
              (sellPrice - incomePrice) * orderItem.quantity;
            return subAcc + revenueDifference;
          } else {
            console.warn(
              "Sell price or income price is undefined for a product."
            );
            return subAcc;
          }
        }, 0)
      );
    }, 0);

    res.status(200).json({ revenue: totalRevenue });
  } catch (err) {
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const fetchCurrentMonthSales = asyncHandler(async (req, res) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const year = today.getFullYear();
  const daysInCurrentMonth = new Date(year, currentMonth + 1, 0).getDate();

  const dailySales = Array(daysInCurrentMonth).fill(0);
  const dailyProfits = Array(daysInCurrentMonth).fill(0);

  try {
    const orders = await prisma.order.findMany({
      where: {
        orderStatusId: 3,
        createdAt: {
          gte: new Date(year, currentMonth, 1),
          lt: new Date(year, currentMonth, today.getDate() + 1),
        },
      },
      include: {
        OrderItems: {
          select: {
            quantity: true,
            Product: {
              select: {
                incomePrice: true,
                currentSellPrice: true,
              },
            },
          },
        },
      },
    });

    for (const order of orders) {
      const orderDay = order.createdAt.getDate() - 1;

      let dailySalesForOrder = 0;
      let dailyProfitForOrder = 0;

      for (const orderItem of order.OrderItems) {
        const { currentSellPrice, incomePrice } = orderItem.Product;
        const itemQuantity = orderItem.quantity;

        dailySalesForOrder += currentSellPrice * itemQuantity;
        dailyProfitForOrder += (currentSellPrice - incomePrice) * itemQuantity;
      }

      dailySales[orderDay] += dailySalesForOrder;
      dailyProfits[orderDay] += dailyProfitForOrder;
    }

    const formattedDailySales = dailySales.map((value) =>
      parseFloat(value.toFixed(2))
    );
    const formattedDailyProfits = dailyProfits.map((value) =>
      parseFloat(value.toFixed(2))
    );

    res.status(200).json({
      daysOfMonth: Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1),
      series: [
        { name: "Сумма", data: formattedDailySales },
        { name: "Прибыль", data: formattedDailyProfits },
      ],
    });
  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({ message: "Ошибка при получении данных о продажах" });
  }
});

const fetchAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    const start = new Date(startDate);
    const end = new Date(
      new Date(endDate).setDate(new Date(endDate).getDate() + 1)
    );

    const orders = await prisma.order.findMany({
      where: {
        orderStatusId: 3,
        createdAt: { gte: start, lt: end },
      },
      include: {
        OrderItems: {
          include: {
            Product: {
              select: {
                sellPrice: true,
                incomePrice: true,
              },
            },
          },
        },
      },
    });

    const orderCount = orders.length;
    const totalSum = orders.reduce(
      (acc, order) => acc + parseFloat(order.sum || 0),
      0
    );

    const totalIncomeValue = orders.reduce((acc, order) => {
      const orderIncome = order.OrderItems.reduce((subAcc, item) => {
        if (item.Product) {
          const { sellPrice, incomePrice } = item.Product;
          return subAcc + (sellPrice - incomePrice) * item.quantity;
        }
        return subAcc;
      }, 0);
      return acc + orderIncome;
    }, 0);

    res.status(200).json({
      orderCount,
      totalSum: totalSum.toFixed(2),
      totalIncomeValue: totalIncomeValue.toFixed(2),
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ message: "Error fetching data." });
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
            where: { barcode: item.productBarcode },
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
              isActive: true,
              limit: true,
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

const fetchMostSoldCategories = asyncHandler(async (req, res) => {
  try {
    const totalProductsCount = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
    });

    const productBarcodes = totalProductsCount
      .map((item) => item.productBarcode)
      .filter((barcode) => barcode !== null);

    const products = await prisma.product.findMany({
      where: {
        barcode: { in: productBarcodes },
      },
      select: { barcode: true, categoryId: true },
    });

    const barcodeToCategoryId = {};
    products.forEach((product) => {
      if (product.categoryId) {
        barcodeToCategoryId[product.barcode] = product.categoryId;
      }
    });

    const categoryTotals = {};

    for (const item of totalProductsCount) {
      const categoryId = barcodeToCategoryId[item.productBarcode];

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, nameRu: true },
        });

        if (category) {
          if (!categoryTotals[category.id]) {
            categoryTotals[category.id] = {
              categoryId: category.id,
              categoryName: category.nameRu,
              quantitySold: 0,
            };
          }
          categoryTotals[category.id].quantitySold += parseInt(
            item._sum.quantity,
            10
          );
        }
      }
    }

    const sortedCategories = Object.values(categoryTotals).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );

    res.status(200).json({
      categories: sortedCategories,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching data." });
  }
});

const fetchMostSoldSubcategories = asyncHandler(async (req, res) => {
  try {
    const totalProductsCount = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
    });

    const productBarcodes = totalProductsCount
      .map((item) => item.productBarcode)
      .filter((barcode) => barcode !== null);

    const products = await prisma.product.findMany({
      where: {
        barcode: { in: productBarcodes },
      },
      select: { barcode: true, subCategoryId: true },
    });

    const barcodeToSubcategoryId = {};
    products.forEach((product) => {
      if (product.subCategoryId) {
        barcodeToSubcategoryId[product.barcode] = product.subCategoryId;
      }
    });

    const subcategoryTotals = {};

    for (const item of totalProductsCount) {
      const subCategoryId = barcodeToSubcategoryId[item.productBarcode];

      if (subCategoryId) {
        const subcategory = await prisma.subCategory.findUnique({
          where: { id: subCategoryId },
          select: { id: true, nameRu: true },
        });

        if (subcategory) {
          if (!subcategoryTotals[subcategory.id]) {
            subcategoryTotals[subcategory.id] = {
              subCategoryId: subcategory.id,
              subcategoryName: subcategory.nameRu,
              quantitySold: 0,
            };
          }
          subcategoryTotals[subcategory.id].quantitySold += parseInt(
            item._sum.quantity,
            10
          );
        }
      }
    }

    const sortedSubcategories = Object.values(subcategoryTotals).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );

    res.status(200).json({
      subcategories: sortedSubcategories,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching data." });
  }
});

const fetchMostSoldSegments = asyncHandler(async (req, res) => {
  try {
    const totalProductsCount = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
    });

    const productBarcodes = totalProductsCount
      .map((item) => item.productBarcode)
      .filter((barcode) => barcode !== null);

    const products = await prisma.product.findMany({
      where: {
        barcode: { in: productBarcodes },
      },
      select: { barcode: true, segmentId: true },
    });

    const barcodeToSegmentId = {};
    products.forEach((product) => {
      if (product.segmentId) {
        barcodeToSegmentId[product.barcode] = product.segmentId;
      }
    });

    const segmentTotals = {};

    for (const item of totalProductsCount) {
      const segmentId = barcodeToSegmentId[item.productBarcode];

      if (segmentId) {
        const segment = await prisma.segment.findUnique({
          where: { id: segmentId },
          select: { id: true, nameRu: true },
        });

        if (segment) {
          if (!segmentTotals[segment.id]) {
            segmentTotals[segment.id] = {
              segmentId: segment.id,
              segmentName: segment.nameRu,
              quantitySold: 0,
            };
          }
          segmentTotals[segment.id].quantitySold += parseInt(
            item._sum.quantity,
            10
          );
        }
      }
    }

    const sortedSegments = Object.values(segmentTotals).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );

    res.status(200).json({
      segments: sortedSegments,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching data." });
  }
});

const fetchMostSoldProductsByBrand = asyncHandler(async (req, res) => {
  const { page, limit } = req.body;
  const skip = (page - 1) * limit;

  try {
    const totalProductsCount = await prisma.orderItem.groupBy({
      by: ["productBarcode"],
      _sum: {
        quantity: true,
      },
    });

    const productBarcodes = totalProductsCount
      .map((item) => item.productBarcode)
      .filter((barcode) => barcode !== null);

    const products = await prisma.product.findMany({
      where: {
        barcode: { in: productBarcodes },
      },
      select: { barcode: true, brandId: true },
    });

    const barcodeToBrandId = {};
    products.forEach((product) => {
      if (product.brandId) {
        barcodeToBrandId[product.barcode] = product.brandId;
      }
    });

    const brandTotals = {};

    for (const item of totalProductsCount) {
      const brandId = barcodeToBrandId[item.productBarcode];

      if (brandId) {
        const brand = await prisma.brand.findUnique({
          where: { id: brandId },
          select: { id: true, name: true },
        });

        if (brand) {
          if (!brandTotals[brand.id]) {
            brandTotals[brand.id] = {
              brandId: brand.id,
              brandName: brand.name,
              quantitySold: 0,
            };
          }
          brandTotals[brand.id].quantitySold += parseInt(
            item._sum.quantity,
            10
          );
        }
      }
    }

    const sortedBrands = Object.values(brandTotals)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(skip, skip + limit);

    const totalBrandsCount = Object.values(brandTotals).length;
    const totalPages = Math.ceil(totalBrandsCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    res.status(200).json({
      brands: sortedBrands,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching most sold products by brand:", err);
    res.status(500).json({ message: "Error fetching data." });
  }
});

router.get("/orders/today", fetchTodaysOrders);
router.get("/revenue/today", fetchTodaysRevenue);
router.get("/revenue/currentmonth", fetchCurrentMonthSales);
router.post("/daterange", fetchAnalytics);
router.post("/mostsoldproducts", fetchMostSoldProducts);
router.get("/popularcategories", fetchMostSoldCategories);
router.get("/popularsubcategories", fetchMostSoldSubcategories);
router.get("/popularsegments", fetchMostSoldSegments);
router.post("/popularbrands", fetchMostSoldProductsByBrand);

export default router;
