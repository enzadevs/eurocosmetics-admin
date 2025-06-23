import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";

const router = express.Router();

const newMessage = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

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
        isActive: false,
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

const getActiveMessages = asyncHandler(async (req, res) => {
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

    const phoneNumbers = await getAllPhoneNumbers();

    const formattedMessage = {
      ...latestActiveMessage,
      createdAt: new Date(latestActiveMessage.createdAt).toLocaleString(
        "en-GB",
        timeFormat
      ),
    };

    res.status(200).json({
      message: formattedMessage,
      phoneNumbers: phoneNumbers,
      totalRecipients: phoneNumbers.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при получении активного сообщения.");
  }
});

// Helper function to get all unique phone numbers
async function getAllPhoneNumbers() {
  try {
    // Get phone numbers from Orders
    const orderPhones = await prisma.order.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    // Get phone numbers from Customers
    const customerPhones = await prisma.customer.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    // Get phone numbers from UnRegisteredCustomers
    const unregCustomerPhones = await prisma.unRegisteredCustomer.findMany({
      select: { phoneNumber: true },
      where: { phoneNumber: { not: null } },
    });

    // Combine all phone numbers and remove duplicates
    const allPhones = [
      ...orderPhones.map((item) => item.phoneNumber),
      ...customerPhones.map((item) => item.phoneNumber),
      ...unregCustomerPhones.map((item) => item.phoneNumber),
    ].filter((phone) => phone !== null);

    // Remove duplicates using Set
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

export default router;
