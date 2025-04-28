import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler, timeFormat } from "../../utils.js";
import { Expo } from "expo-server-sdk";

const router = express.Router();
const expo = new Expo();

const newToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  try {
    const existingToken = await prisma.deviceToken.findUnique({
      where: { token: token },
    });

    if (existingToken) {
      res.status(200).json({ message: "Токен уже существует." });
    } else {
      await prisma.deviceToken.create({
        data: { token: token },
      });

      res.status(201).json({ message: "Токен создан." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при содании токена.");
  }
});

const getAllDevicesCount = asyncHandler(async (req, res) => {
  try {
    const devices = await prisma.deviceToken.count();

    res.status(200).json({ devices: devices });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  try {
    const notifications = await prisma.pushNotification.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formattedNotifications = notifications.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toLocaleString("en-GB", timeFormat),
      updatedAt: new Date(item.updatedAt).toLocaleString("en-GB", timeFormat),
    }));

    res.status(200).json({ notifications: formattedNotifications });
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const sendPushNotification = asyncHandler(async (req, res) => {
  const { title, body } = req.body;

  try {
    const deviceTokens = await prisma.deviceToken.findMany({
      select: { token: true },
    });

    let messages = [];
    for (let { token } of deviceTokens) {
      if (token.includes("@enzadevs/baysel")) {
        continue;
      }

      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token.`);
        continue;
      }

      messages.push({
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: { withSome: "data" },
      });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error(`Error sending chunk:`, error);
      }
    }

    await prisma.pushNotification.create({
      data: { title, body },
    });

    res.status(200).json({ message: "Пуш уведомление отправлено." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка при отправке пуш уведомления.");
  }
});

const deletePush = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.pushNotification.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: "Пуш уведомление удалено." });
  } catch (error) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Уведомление не найдено." });
    } else {
      res
        .status(500)
        .json({ message: "Произошла ошибка при удалении уведомлении." });
    }
  }
});

const deleteDevices = asyncHandler(async (req, res) => {
  try {
    await prisma.deviceToken.deleteMany();

    res.status(200).json({ message: "Все устройства удалены." });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Произошла ошибка при удалении уведомлении." });
  }
});

router.post("/newtoken", newToken);
router.get("/devices", getAllDevicesCount);
router.get("/notifications", getAllMessages);
router.post("/send", sendPushNotification);
router.delete("/delete/:id", deletePush);
router.delete("/devices/delete", deleteDevices);

export default router;
