import express from "express";
import { prisma } from "../../exportprisma.js";
import { asyncHandler } from "../../utils.js";

const router = express.Router();

const postSettings = asyncHandler(async (req, res) => {
  try {
    await prisma.settings.create({
      data: {
        pointSystemIsActive: false,
        ordersValid: true,
        newVersion: true,
      },
    });
    res.status(201).json({ message: "Настройки созданы." });
  } catch (err) {
    res.status(500).send("Ошибка при создании настроек.");
  }
});

const fetchSettings = asyncHandler(async (req, res) => {
  try {
    const info = await prisma.settings.findFirst();

    res.status(200).json(info);
  } catch (err) {
    res.status(500).send("Ошибка при получении данных.");
  }
});

const updateSettings = asyncHandler(async (req, res) => {
  const {
    contactNumberOne,
    contactNumberTwo,
    aboutTm,
    aboutRu,
    usageTm,
    usageRu,
    deliveryInfoTm,
    deliveryInfoRu,
    addressTm,
    addressRu,
    instagramOne,
    instagramTwo,
    tiktok,
    imo,
    email,
    expressPrice,
    expressInfoTm,
    expressInfoRu,
    expressIsActive,
    pointSystemIsActive,
    pointsPercentage,
    ordersValid,
    newVersion,
    otpIsActive,
    androidVersion,
    iosVersion,
  } = req.body;

  try {
    const existingSettings = await prisma.settings.findUnique({
      where: { id: 1 },
    });

    const newSettings = {
      contactNumberOne: contactNumberOne || existingSettings.contactNumberOne,
      contactNumberTwo: contactNumberTwo || existingSettings.contactNumberTwo,
      aboutTm: aboutTm || existingSettings.aboutTm,
      aboutRu: aboutRu || existingSettings.aboutRu,
      usageTm: usageTm || existingSettings.usageTm,
      usageRu: usageRu || existingSettings.usageRu,
      deliveryInfoTm: deliveryInfoTm || existingSettings.deliveryInfoTm,
      deliveryInfoRu: deliveryInfoRu || existingSettings.deliveryInfoRu,
      addressTm: addressTm || existingSettings.addressTm,
      addressRu: addressRu || existingSettings.addressRu,
      instagramOne: instagramOne || existingSettings.instagramOne,
      instagramTwo: instagramTwo || existingSettings.instagramTwo,
      tiktok: tiktok || existingSettings.tiktok,
      imo: imo || existingSettings.imo,
      email: email || existingSettings.email,
      expressPrice: Number(expressPrice) || existingSettings.expressPrice,
      expressInfoTm: expressInfoTm || existingSettings.expressInfoTm,
      expressInfoRu: expressInfoRu || existingSettings.expressInfoRu,
      expressIsActive: expressIsActive,
      pointSystemIsActive: pointSystemIsActive,
      pointsPercentage:
        Number(pointsPercentage) || existingSettings.pointsPercentage,
      ordersValid: ordersValid,
      newVersion: newVersion,
      otpIsActive: otpIsActive,
      androidVersion: androidVersion || existingSettings.androidVersion,
      iosVersion: iosVersion || existingSettings.iosVersion,
    };

    await prisma.settings.update({
      where: { id: 1 },
      data: newSettings,
    });

    res.status(201).json({ message: "Информация успешно обновлена." });
  } catch (err) {
    console.log(err);
    res.status(500).send("Ошибка при обновлении информации.");
  }
});

router.post("/new", postSettings);
router.get("/get", fetchSettings);
router.patch("/update/1", updateSettings);

export default router;
