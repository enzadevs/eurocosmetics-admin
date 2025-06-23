import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();

const fetchAllOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    orderCityId,
    paymentTypeId,
    deliveryTypeId,
    orderStatusId,
    orderTimeId,
    query,
    startDate,
    endDate,
  } = req.body;
  try {
    const filterConditions = {};

    if (orderCityId) filterConditions.orderCityId = orderCityId;
    if (orderTimeId) filterConditions.orderTimeId = orderTimeId;
    if (paymentTypeId) filterConditions.paymentTypeId = paymentTypeId;
    if (deliveryTypeId) filterConditions.deliveryTypeId = deliveryTypeId;
    if (orderStatusId) filterConditions.orderStatusId = orderStatusId;

    if (startDate || endDate) {
      const start = new Date(startDate);
      const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      filterConditions.createdAt = {};
      if (startDate) {
        filterConditions.createdAt.gte = start;
      }
      if (endDate) {
        filterConditions.createdAt.lte = end;
      }
    }

    let queryConditions = [];

    if (query) {
      queryConditions = [
        { phoneNumber: { contains: query, mode: "insensitive" } },
        { Address: { street: { contains: query, mode: "insensitive" } } },
        { Address: { house: { contains: query, mode: "insensitive" } } },
        { Customer: { username: { contains: query, mode: "insensitive" } } },
        { Customer: { phoneNumber: { contains: query, mode: "insensitive" } } },
        {
          UnRegisteredCustomer: {
            username: { contains: query, mode: "insensitive" },
          },
        },
        {
          UnRegisteredCustomer: {
            phoneNumber: { contains: query, mode: "insensitive" },
          },
        },
        { comment: { contains: query, mode: "insensitive" } },
      ];

      const numericQuery = parseInt(query, 10);
      if (
        !isNaN(numericQuery) &&
        numericQuery <= 2147483647 &&
        numericQuery >= -2147483648
      ) {
        queryConditions.push({ id: numericQuery });
      }
    }

    const whereCondition = {
      ...filterConditions,
      orderStatusId: { notIn: [3, 4] },
      OR: [
        { Customer: { isBlocked: false } },
        { UnRegisteredCustomer: { userIsBlocked: false } },
      ],
    };

    if (queryConditions.length > 0) {
      whereCondition.AND = [
        {
          ...filterConditions,
          orderStatusId: { notIn: [3, 4] },
          OR: [
            { Customer: { isBlocked: false } },
            { UnRegisteredCustomer: { userIsBlocked: false } },
          ],
        },
        { OR: queryConditions },
      ];
    }

    const ordersCount = await prisma.order.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(ordersCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const orders = await prisma.order.findMany({
      where: whereCondition,
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        orderStatusId: true,
        sum: true,
        phoneNumber: true,
        OrderCity: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderTime: {
          select: {
            id: true,
            nameRu: true,
            time: true,
          },
        },
        PaymentType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        DeliveryType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderStatus: {
          select: {
            id: true,
            nameRu: true,
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => {
      const formattedCreatedAt = new Date(order.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...order,
        createdAt: formattedCreatedAt,
      };
    });

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const fetchDeliveredOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    orderCityId,
    paymentTypeId,
    deliveryTypeId,
    orderStatusId,
    orderTimeId,
    minPrice,
    maxPrice,
    query,
    startDate,
    endDate,
  } = req.body;

  try {
    const filterConditions = {};

    if (orderCityId) filterConditions.orderCityId = orderCityId;
    if (orderTimeId) filterConditions.orderTimeId = orderTimeId;
    if (paymentTypeId) filterConditions.paymentTypeId = paymentTypeId;
    if (deliveryTypeId) filterConditions.deliveryTypeId = deliveryTypeId;
    if (orderStatusId) filterConditions.orderStatusId = orderStatusId;

    if (minPrice || maxPrice) {
      filterConditions.sum = {};
      if (minPrice) filterConditions.sum.gte = minPrice;
      if (maxPrice) filterConditions.sum.lte = maxPrice;
    }

    if (startDate || endDate) {
      const start = new Date(startDate);
      const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      filterConditions.createdAt = {};
      if (startDate) {
        filterConditions.createdAt.gte = start;
      }
      if (endDate) {
        filterConditions.createdAt.lte = end;
      }
    }

    const numericQuery = parseFloat(query);

    if (
      !isNaN(numericQuery) &&
      numericQuery <= 2147483647 &&
      numericQuery >= -2147483648
    ) {
      if (!filterConditions.AND) {
        filterConditions.AND = [];
      }

      filterConditions.AND.push({
        OR: [
          { id: { equals: numericQuery } },
          { phoneNumber: { contains: query, mode: "insensitive" } },
          {
            Customer: { phoneNumber: { contains: query, mode: "insensitive" } },
          },
          {
            UnRegisteredCustomer: {
              phoneNumber: { contains: query, mode: "insensitive" },
            },
          },
        ],
      });
    } else {
      if (query) {
        if (!filterConditions.AND) {
          filterConditions.AND = [];
        }

        const queryConditions = [
          { phoneNumber: { contains: query, mode: "insensitive" } },
          { Address: { street: { contains: query, mode: "insensitive" } } },
          { Address: { house: { contains: query, mode: "insensitive" } } },
          { Customer: { username: { contains: query, mode: "insensitive" } } },
          {
            Customer: { phoneNumber: { contains: query, mode: "insensitive" } },
          },
          {
            UnRegisteredCustomer: {
              phoneNumber: { contains: query, mode: "insensitive" },
            },
          },
          {
            UnRegisteredCustomer: {
              username: { contains: query, mode: "insensitive" },
            },
          },
          { comment: { contains: query, mode: "insensitive" } },
        ];

        filterConditions.AND.push({ OR: queryConditions });
      }
    }

    const ordersCount = await prisma.order.count({
      where: {
        ...filterConditions,
        orderStatusId: 3,
        OR: [
          { Customer: { isBlocked: false } },
          { UnRegisteredCustomer: { userIsBlocked: false } },
        ],
      },
    });

    const totalPages = Math.ceil(ordersCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const orders = await prisma.order.findMany({
      where: {
        ...filterConditions,
        orderStatusId: 3,
        OR: [
          { Customer: { isBlocked: false } },
          { UnRegisteredCustomer: { userIsBlocked: false } },
        ],
      },
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        OrderCity: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderTime: true,
        PaymentType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        DeliveryType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderStatus: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        Address: {
          select: {
            street: true,
          },
        },
        CourierLang: {
          select: {
            id: true,
            nameRu: true,
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => {
      const formattedCreatedAt = new Date(order.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      const formattedUpdatedAt = new Date(order.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...order,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const fetchCancelledOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    orderCityId,
    paymentTypeId,
    deliveryTypeId,
    orderStatusId,
    orderTimeId,
    minPrice,
    maxPrice,
    query,
    startDate,
    endDate,
  } = req.body;

  try {
    const filterConditions = {};

    if (orderCityId) filterConditions.orderCityId = orderCityId;
    if (orderTimeId) filterConditions.orderTimeId = orderTimeId;
    if (paymentTypeId) filterConditions.paymentTypeId = paymentTypeId;
    if (deliveryTypeId) filterConditions.deliveryTypeId = deliveryTypeId;
    if (orderStatusId) filterConditions.orderStatusId = orderStatusId;

    if (minPrice || maxPrice) {
      filterConditions.sum = {};
      if (minPrice) filterConditions.sum.gte = minPrice;
      if (maxPrice) filterConditions.sum.lte = maxPrice;
    }

    if (startDate || endDate) {
      const start = new Date(startDate);
      const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      filterConditions.createdAt = {};
      if (startDate) {
        filterConditions.createdAt.gte = start;
      }
      if (endDate) {
        filterConditions.createdAt.lte = end;
      }
    }

    const numericQuery = parseFloat(query);

    if (
      !isNaN(numericQuery) &&
      numericQuery <= 2147483647 &&
      numericQuery >= -2147483648
    ) {
      if (!filterConditions.AND) {
        filterConditions.AND = [];
      }
      filterConditions.AND.push({
        OR: [{ id: { equals: numericQuery } }],
      });
    } else {
      if (query) {
        if (!filterConditions.AND) {
          filterConditions.AND = [];
        }

        const queryConditions = [
          { phoneNumber: { contains: query, mode: "insensitive" } },
          { Address: { street: { contains: query, mode: "insensitive" } } },
          { Address: { house: { contains: query, mode: "insensitive" } } },
          { Customer: { username: { contains: query, mode: "insensitive" } } },
          {
            Customer: { phoneNumber: { contains: query, mode: "insensitive" } },
          },
          {
            UnRegisteredCustomer: {
              phoneNumber: { contains: query, mode: "insensitive" },
            },
          },
          {
            UnRegisteredCustomer: {
              username: { contains: query, mode: "insensitive" },
            },
          },
          { comment: { contains: query, mode: "insensitive" } },
        ];

        filterConditions.AND.push({ OR: queryConditions });
      }
    }

    const ordersCount = await prisma.order.count({
      where: {
        ...filterConditions,
        orderStatusId: 4,
        OR: [
          { Customer: { isBlocked: false } },
          { UnRegisteredCustomer: { userIsBlocked: false } },
        ],
      },
    });

    const totalPages = Math.ceil(ordersCount / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const orders = await prisma.order.findMany({
      where: {
        ...filterConditions,
        orderStatusId: 4,
        OR: [
          { Customer: { isBlocked: false } },
          { UnRegisteredCustomer: { userIsBlocked: false } },
        ],
      },
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        OrderCity: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderTime: true,
        PaymentType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        DeliveryType: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        OrderStatus: {
          select: {
            id: true,
            nameRu: true,
          },
        },
        Address: {
          select: {
            street: true,
          },
        },
        CourierLang: {
          select: {
            id: true,
            nameRu: true,
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => {
      const formattedCreatedAt = new Date(order.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      const formattedUpdatedAt = new Date(order.updatedAt).toLocaleString(
        "en-GB",
        timeFormat
      );

      return {
        ...order,
        createdAt: formattedCreatedAt,
        updatedAt: formattedUpdatedAt,
      };
    });

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        currentPage,
        totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const checkOut = asyncHandler(async (req, res) => {
  const { orderItems } = req.body;

  try {
    const adjustedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { barcode: item.barcode },
        });

        if (!product) {
          throw new Error(`Товар с штрихкодом ${item.barcode} не найден.`);
        }

        const availableQuantity = product.stock;
        const requestedQuantity = item.quantity;

        if (requestedQuantity > availableQuantity) {
          return {
            barcode: item.barcode,
            quantity: availableQuantity,
          };
        } else {
          return {
            barcode: item.barcode,
            quantity: requestedQuantity,
          };
        }
      })
    );

    res.status(200).json({
      message: "Количества были изменены в соответствии с складом.",
      adjustedItems,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Ошибка при проверке наличия на складе.",
      error: err.message,
    });
  }
});

const newOrder = asyncHandler(async (req, res) => {
  const {
    customerId,
    unRegisteredCustomerId,
    phoneNumber,
    username,
    comment,
    pointsEarned,
    payPoints,
    orderItems,
    orderCityId,
    orderTimeId,
    paymentTypeId,
    deliveryTypeId,
    orderStatusId,
    courierLangId,
    address,
  } = req.body;

  console.log(req.body);

  try {
    if (customerId) {
      const user = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (user?.isBlocked === true) {
        return res.status(403).json({
          message:
            "Вы были заблокированы администрацией и не можете делать заказы. Свяжитесь с администрацией для разблокировки.",
        });
      }
    }

    if (unRegisteredCustomerId) {
      const user = await prisma.unRegisteredCustomer.findUnique({
        where: { id: Number(unRegisteredCustomerId) },
      });

      if (user?.userIsBlocked === true) {
        return res.status(403).json({
          message:
            "Вы были заблокированы администрацией и не можете делать заказы.",
        });
      }
    }

    const products = await prisma.product.findMany({
      where: {
        barcode: {
          in: orderItems.map((item) => item.barcode),
        },
      },
      select: {
        barcode: true,
        currentSellPrice: true,
      },
    });

    const priceMap = products.reduce((map, product) => {
      map[product.barcode] = product.currentSellPrice;
      return map;
    }, {});

    const missingProducts = orderItems.filter(
      (item) => !priceMap[item.barcode]
    );

    if (missingProducts.length > 0) {
      console.log("Некоторые товары не найдены");
    }

    const productsArray = orderItems.map((product) => ({
      productBarcode: product.barcode,
      quantity: product.quantity || 1,
      currentSellPrice: priceMap[product.barcode],
    }));

    const calculatedSum = productsArray.reduce((total, item) => {
      return total + Number(item.currentSellPrice) * Number(item.quantity);
    }, 0);

    let unregisteredUser;

    const unRegUserUpdateData = {
      username: username || null,
      phoneNumber: phoneNumber || null,
    };

    if (unRegisteredCustomerId) {
      unregisteredUser = await prisma.unRegisteredCustomer.update({
        where: { id: Number(unRegisteredCustomerId) },
        data: unRegUserUpdateData,
      });
    } else {
      unregisteredUser = await prisma.unRegisteredCustomer.create({
        data: unRegUserUpdateData,
      });
    }

    const actualPayPoints = Math.min(Number(payPoints) || 0, calculatedSum);

    let orderData = {
      phoneNumber,
      comment,
      sum: calculatedSum,
      pointsEarned: customerId ? Number(pointsEarned) : 0,
      payPoints: actualPayPoints,
      PaymentType: { connect: { id: Number(paymentTypeId) } },
      DeliveryType: { connect: { id: Number(deliveryTypeId) } },
      OrderStatus: { connect: { id: Number(orderStatusId) } },
      OrderItems: {
        create: productsArray,
      },
      UnRegisteredCustomer: { connect: { id: unregisteredUser.id } },
    };

    if (orderTimeId) {
      orderData.OrderTime = { connect: { id: Number(orderTimeId) } };
    }

    if (orderCityId) {
      orderData.OrderCity = { connect: { id: Number(orderCityId) } };
    }

    if (courierLangId) {
      orderData.CourierLang = { connect: { id: Number(courierLangId) } };
    }

    let order;

    if (address) {
      const newAddress = await prisma.address.create({
        data: {
          street: address || "",
          house: address.house || "",
          entrance: address.entrance || "",
          roof: address.roof || "",
          room: address.room || "",
        },
      });
      orderData.Address = { connect: { id: newAddress.id } };
    }

    if (customerId) {
      orderData.Customer = { connect: { id: customerId } };
    }

    order = await prisma.order.create({
      data: orderData,
    });

    if (customerId) {
      await prisma.$transaction(async () => {
        if (payPoints) {
          await prisma.customer.update({
            where: { id: customerId },
            data: { pointsEarned: { decrement: actualPayPoints } },
          });
        }

        if (pointsEarned) {
          await prisma.customer.update({
            where: { id: customerId },
            data: { pointsEarned: { increment: Number(pointsEarned) } },
          });
        }
      });
    }

    await prisma.$transaction(
      productsArray.map((product) =>
        prisma.product.update({
          where: { barcode: product.productBarcode },
          data: {
            stock: {
              decrement: product.quantity,
            },
          },
        })
      )
    );

    res.status(201).json({
      message: "Заказ был сделан.",
      order,
      ...(unRegisteredCustomerId && { unRegisteredCustomerId }),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка при создании заказа." });
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    phoneNumber,
    comment,
    sum,
    orderItems,
    orderCityId,
    orderTimeId,
    paymentTypeId,
    deliveryTypeId,
    orderStatusId,
    courierLangId,
    address,
  } = req.body;

  try {
    const updateData = {};

    if (orderCityId) {
      updateData.OrderCity = {
        connect: { id: Number(orderCityId) },
      };
    }

    if (orderTimeId) {
      updateData.OrderTime = {
        connect: { id: Number(orderTimeId) },
      };
    }

    if (paymentTypeId) {
      updateData.PaymentType = {
        connect: { id: Number(paymentTypeId) },
      };
    }

    if (deliveryTypeId) {
      updateData.DeliveryType = {
        connect: { id: Number(deliveryTypeId) },
      };
    }

    if (orderStatusId) {
      updateData.OrderStatus = {
        connect: { id: Number(orderStatusId) },
      };
    }

    if (courierLangId) {
      updateData.CourierLang = { connect: { id: Number(courierLangId) } };
    }

    if (phoneNumber) {
      updateData.phoneNumber = phoneNumber;
    }

    if (comment) {
      updateData.comment = comment;
    }

    if (sum) {
      updateData.sum = sum;
    }

    if (orderItems) {
      const orderItemsData = orderItems.map((item) => ({
        productBarcode: item.barcode,
        quantity: item.quantity,
      }));

      const existingOrder = await prisma.order.findUnique({
        where: { id: Number(id) },
        select: { OrderItems: true },
      });

      const existingItemsMap = new Map(
        existingOrder.OrderItems.map((item) => [item.productBarcode, item])
      );

      const itemsToUpdate = [];
      const itemsToCreate = [];

      orderItemsData.forEach((item) => {
        if (existingItemsMap.has(item.productBarcode)) {
          itemsToUpdate.push({
            id: existingItemsMap.get(item.productBarcode).id,
            quantity: item.quantity,
          });
        } else {
          itemsToCreate.push({
            productBarcode: item.barcode,
            quantity: item.quantity,
          });
        }
      });

      const itemsToRemove = existingOrder.OrderItems.filter(
        (item) =>
          !orderItemsData.some((i) => i.productBarcode === item.productBarcode)
      );
      const deletePromises = itemsToRemove.map((item) =>
        prisma.orderItem.delete({
          where: { id: item.id },
        })
      );

      await Promise.all([
        ...deletePromises,
        ...itemsToUpdate.map((item) =>
          prisma.orderItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity },
          })
        ),
        ...itemsToCreate.map((item) =>
          prisma.orderItem.create({
            data: {
              productBarcode: item.barcode,
              quantity: item.quantity,
              orderId: Number(id),
            },
          })
        ),
      ]);
    }

    if (address) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: Number(id) },
        select: { Address: true },
      });

      if (existingOrder?.Address) {
        const addressUpdateData = {};
        if (address.street !== undefined)
          addressUpdateData.street = address.street;
        if (address.house !== undefined)
          addressUpdateData.house = address.house;
        if (address.entrance !== undefined)
          addressUpdateData.entrance = address.entrance;
        if (address.roof !== undefined) addressUpdateData.roof = address.roof;
        if (address.room !== undefined) addressUpdateData.room = address.room;

        if (Object.keys(addressUpdateData).length > 0) {
          await prisma.address.update({
            where: { id: existingOrder.Address.id },
            data: addressUpdateData,
          });
        }
      } else {
        const newAddress = await prisma.address.create({
          data: {
            street: address.street || null,
            house: address.house || null,
            entrance: address.entrance || null,
            roof: address.roof || null,
            room: address.room || null,
          },
        });
        updateData.Address = { connect: { id: newAddress.id } };
      }
    }

    await prisma.order.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json({ message: "Данные заказа успешно обновлены." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при обновлении данных заказа." });
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItems: true,
        Customer: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Заказ не был найден." });
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        order.OrderItems.map((product) =>
          tx.product.update({
            where: { barcode: product.productBarcode },
            data: {
              stock: {
                increment: product.quantity,
              },
            },
          })
        )
      );

      if (order.customerId && order.Customer) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            pointsEarned: {
              decrement: Number(order.pointsEarned),
            },
            ...(order.payPoints > 0 && {
              pointsEarned: {
                increment: Number(order.payPoints),
              },
            }),
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          OrderStatus: { connect: { id: 4 } },
        },
      });
    });

    res.status(200).json({
      message: "Заказ отменен. Баллы обновлены.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Вышла ошибка при отмене заказа." });
  }
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.order.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Заказ удален." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Заказ не найден." });
    } else {
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении заказа." });
    }
  }
});

const deleteAllOrders = asyncHandler(async (req, res) => {
  try {
    await prisma.order.deleteMany();

    res.status(200).json({ message: "Заказы удалены." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Заказы не найден." });
    } else {
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении заказов." });
    }
  }
});

const fetchOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        Customer: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
        UnRegisteredCustomer: {
          select: {
            id: true,
            username: true,
          },
        },
        OrderItems: {
          include: {
            Product: {
              select: {
                Category: {
                  select: {
                    id: true,
                    nameRu: true,
                  },
                },
                barcode: true,
                nameTm: true,
                nameRu: true,
                currentSellPrice: true,
                imageOne: true,
                unit: true,
              },
            },
          },
        },
        OrderCity: true,
        OrderTime: true,
        DeliveryType: true,
        OrderStatus: true,
        PaymentType: true,
        Address: true,
        CourierLang: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Заказ не был найден." });
    }

    const orderWithUserData = {
      ...order,
      createdAt: new Date(order.createdAt).toLocaleString("en-GB", timeFormat),
      updatedAt: new Date(order.updatedAt).toLocaleString("en-GB", timeFormat),
    };

    res.status(200).json({ order: orderWithUserData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка при получении данных." });
  }
});

const prepareOrder = asyncHandler(async (req, res) => {
  try {
    const otherInfo = await prisma.settings.findUnique({
      where: { id: 1 },
      select: {
        addressTm: true,
        addressRu: true,
        ordersValid: true,
        expressInfoTm: true,
        expressInfoRu: true,
        expressPrice: true,
        pointsPercentage: true,
        pointSystemIsActive: true,
      },
    });

    const orderCities = await prisma.orderCity.findMany({
      where: { isActive: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const allOrderTimes = await prisma.orderTime.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            Orders: {
              where: {
                createdAt: {
                  gte: today,
                  lt: tomorrow,
                },
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    const orderTimes = allOrderTimes
      .filter((orderTime) => {
        if (!orderTime.limit) return true;

        return orderTime._count.Orders < orderTime.limit;
      })
      .map(({ _count, ...orderTime }) => orderTime);

    const deliveryTypes = await prisma.deliveryType.findMany({
      where: { isActive: true },
    });

    const paymentTypes = await prisma.paymentType.findMany({
      where: { isActive: true },
    });

    const couriers = await prisma.courierLang.findMany({
      where: { isActive: true },
    });

    const preparedOrder = {
      otherInfo,
      orderCities,
      orderTimes,
      deliveryTypes,
      paymentTypes,
      couriers,
    };

    res.status(200).json({
      preparedOrder,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Ошибка при подготовки заказа.",
      error: err.message,
    });
  }
});

router.post("/current", fetchAllOrders);
router.post("/delivered", fetchDeliveredOrders);
router.post("/cancelled", fetchCancelledOrders);
router.post("/checkout", checkOut);
router.post("/new", newOrder);
router.patch("/update/:id", updateOrder);
router.patch("/cancel", cancelOrder);
router.delete("/deleteall", deleteAllOrders);
router.delete("/delete/:id", deleteOrder);
router.get("/fetch/:id", fetchOrderById);
router.get("/prepare", prepareOrder);

export default router;
