import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();

const newMessage = asyncHandler(async (req, res) => {
  const { title, content, isActive } = req.body;

  try {
    if (!title && !content) {
      return res
        .status(400)
        .json({ message: "Заголовок или содержание обязательны." });
    }

    const message = await prisma.marketingMessage.create({
      data: {
        title: title || null,
        content: content || null,
        isActive: isActive || false,
      },
    });

    res.status(201).json({
      message: "Маркетинговое сообщение создано.",
      data: message,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при создании сообщения.");
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ message: "ID сообщения обязателен." });
    }
    const existingMessage = await prisma.marketingMessage.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    await prisma.marketingMessage.update({
      where: { id: Number(id) },
      data: { isActive: true },
    });

    const phoneNumbers = await getAllPhoneNumbers();

    res.status(200).json({
      message: "Сообщение активировано для отправки.",
      phoneNumbers: phoneNumbers,
      totalRecipients: phoneNumbers.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при отправке сообщения.");
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await prisma.marketingMessage.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedMessages = messages.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toLocaleString("en-GB", timeFormat),
    }));

    res.status(200).json({ messages: formattedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении данных.");
  }
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.marketingMessage.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Маркетинговое сообщение удалено." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Сообщение не найдено." });
    } else {
      console.error(error);
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении сообщения." });
    }
  }
});

const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, isActive } = req.body;

  try {
    const existingMessage = await prisma.marketingMessage.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMessage) {
      return res.status(404).json({ message: "Сообщение не найдено." });
    }

    const updatedMessage = await prisma.marketingMessage.update({
      where: { id: Number(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.status(200).json({
      message: "Сообщение обновлено.",
      data: updatedMessage,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Произошла ошибка при обновлении сообщения." });
  }
});

const getPhoneNumbers = asyncHandler(async (req, res) => {
  try {
    const phoneNumbers = await getAllPhoneNumbers();

    res.status(200).json({
      phoneNumbers: phoneNumbers,
      total: phoneNumbers.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении номеров телефонов.");
  }
});

// GET /active?page=2&limit=20 - Page 2, limit 20
const getActiveMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const latestActiveMessage = await prisma.marketingMessage.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!latestActiveMessage) {
      return res
        .status(404)
        .json({ message: "Активных сообщений не найдено." });
    }

    const allPhoneNumbers = await getAllPhoneNumbers();
    const totalRecipients = allPhoneNumbers.length;

    const totalPages = Math.ceil(totalRecipients / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPhoneNumbers = allPhoneNumbers.slice(startIndex, endIndex);

    const formattedMessage = {
      ...latestActiveMessage,
      createdAt: new Date(latestActiveMessage.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      ),
    };

    res.status(200).json({
      message: formattedMessage,
      phoneNumbers: paginatedPhoneNumbers,
      totalRecipients: totalRecipients,
      pagination: {
        currentPage: parseInt(currentPage),
        totalPages,
        limit: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении активного сообщения.");
  }
});

async function getAllPhoneNumbers() {
  try {
    const orderPhones = await prisma.order.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    const customerPhones = await prisma.customer.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    const unregCustomerPhones = await prisma.unRegisteredCustomer.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    const allPhones = [
      ...orderPhones.map((item) => item.phoneNumber),
      ...customerPhones.map((item) => item.phoneNumber),
      ...unregCustomerPhones.map((item) => item.phoneNumber),
    ].filter((phone) => phone !== null);

    const uniquePhones = [...new Set(allPhones)];

    return uniquePhones;
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    throw error;
  }
}

router.post("/new", newMessage);
router.post("/send", sendMessage);
router.get("/messages", getAllMessages);
router.get("/phones", getPhoneNumbers);
router.get("/active", getActiveMessages);
router.put("/update/:id", updateMessage);
router.delete("/delete/:id", deleteMessage);

const createOrderMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  try {
    if (!orderId) {
      return res.status(400).json({ message: "ID заказа обязателен." });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        PaymentType: true,
        OrderTime: true,
        Address: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Заказ не найден." });
    }

    const content = `Ваш заказ принят.
    Номер заказа: ${order.id}
    Номер телефона: ${order.phoneNumber || "Не указан"}
    Оплата: ${order.PaymentType?.nameRu || "Не указан"}
    Время доставки: ${order.OrderTime?.nameRu || "Не указано"}
    Место Доставки: ${order.Address?.street || "Не указано"}
    Сумма товаров: ${order.sum || "0"}`;

    const title = `СМС на заказ No ${order.id}`;

    const orderMessage = await prisma.orderMessage.create({
      data: {
        title,
        content,
        isActive: true,
      },
    });

    await prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        orderMessageId: orderMessage.id,
      },
    });

    res.status(201).json({
      message: "Сообщение заказа создано.",
      data: orderMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при создании сообщения заказа.");
  }
});

const getAllOrderMessages = asyncHandler(async (req, res) => {
  try {
    const orderMessages = await prisma.orderMessage.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Order: {
          select: {
            id: true,
            phoneNumber: true,
          },
        },
      },
    });

    const formattedMessages = orderMessages.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toLocaleString("en-GB", timeFormat),
      orderCount: item.Order.length,
    }));

    res.status(200).json({
      orderMessages: formattedMessages,
      total: formattedMessages.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении сообщений заказов.");
  }
});

router.post("/message/create/:orderId", createOrderMessage);
router.get("/order/get", getAllOrderMessages);

export default router;
