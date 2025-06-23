"use client";

import clsx from "clsx";
import Image from "next/image";
import BackForthButtons from "@/components/nav/BackForthButtons";
import CategoryPicker from "@/components/pickers/CategoryPicker";
import SubCategoryPicker from "@/components/pickers/SubCategoryPicker";
import SegmentPicker from "@/components/pickers/SegmentPicker";
import ProductsList from "@/components/tables/ProductsList";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Switch, Field, Textarea, Description } from "@headlessui/react";
import { PlusIcon, ImagePlus } from "lucide-react";

export default function NewBannerPage() {
  const [selectedImage, setSelectedImage] = useState();
  const [selectedMobileImage, setSelectedMobileImage] = useState();
  const [isActive, setIsActive] = useState(true);
  const { register, handleSubmit } = useForm();
  const [productsArray, setProductsArray] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState();
  const [selectedMobileVideo, setSelectedMobileVideo] = useState();
  const [videoDuration, setVideoDuration] = useState(null);
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productBarcodeRef = useRef(null);
  const router = useRouter();
  const { admin } = useAdminStore();

  const createBannerRequest = async (data) => {
    // if (
    //   (selectedImage || selectedMobileImage) &&
    //   (selectedVideo || selectedMobileVideo)
    // ) {
    //   ErrorToast({
    //     errorText: "Выберите либо изображения , либо видео .",
    //   });
    //   return;
    // }

    const selectedLinkOptions = [
      categoryIdRef.current,
      subCategoryIdRef.current,
      segmentIdRef.current,
    ].filter(Boolean);

    if (selectedLinkOptions.length > 1) {
      ErrorToast({
        errorText:
          "Выберите только категорию, подкатегорию, сегмент или товар чтобы прикрепить ссылку.",
      });
      return;
    }

    if (!data.startDate) {
      ErrorToast({ errorText: "Пожалуйста, введите дату начала." });
      return;
    }

    if (!data.endDate) {
      ErrorToast({ errorText: "Пожалуйста, введите дату окончания." });
      return;
    }

    if (!selectedImage) {
      ErrorToast({ errorText: "Пожалуйста, загрузите изображение." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("headerTm", data.headerTm);
      formData.append("headerRu", data.headerRu);
      formData.append("descriptionTm", data.descriptionTm);
      formData.append("descriptionRu", data.descriptionRu);
      formData.append("contentTm", data.descriptionTm);
      formData.append("contentRu", data.descriptionRu);
      formData.append("blogerName", "");
      formData.append("order", data.order);
      formData.append("isActive", isActive);
      formData.append("image", selectedImage);
      formData.append("startDate", data.startDate);
      formData.append("endDate", data.endDate);

      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      if (selectedMobileImage) {
        formData.append("mobileImage", selectedMobileImage);
      }

      if (selectedMobileVideo) {
        formData.append("mobileVideo", selectedMobileVideo);
      }

      if (videoDuration) {
        formData.append("videoDuration", videoDuration);
      }

      if (productsArray) {
        let productsArrayFormatted;

        if (Array.isArray(productsArray)) {
          productsArrayFormatted = productsArray;
        } else if (typeof productsArray === "string" && productsArray.trim()) {
          productsArrayFormatted = productsArray
            .split(",")
            .map((item) => item.trim());
        } else {
          productsArrayFormatted = [];
        }

        formData.append(
          "productsArray",
          JSON.stringify(productsArrayFormatted)
        );
      } else {
        formData.append("productsArray", null);
      }
      if (categoryIdRef.current) {
        formData.append("categoryId", categoryIdRef.current);
      }
      if (subCategoryIdRef.current) {
        formData.append("subCategoryId", subCategoryIdRef.current);
      }
      if (segmentIdRef.current) {
        formData.append("segmentId", segmentIdRef.current);
      }
      if (productBarcodeRef.current) {
        formData.append("productBarcode", productBarcodeRef.current);
      }

      const response = await fetch(`${apiUrl}/minitwo/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлен совет." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый совет : ${data.name}`,
          "CREATE"
        );

        NProgress.start();
        router.push("/home/minitwo");
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  function getFile(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  }

  function getMobileFile(e) {
    const file = e.target.files[0];
    setSelectedMobileImage(file || null);
  }

  const handleProductsArrayChange = (e) => {
    setProductsArray(e.target.value);
  };

  const handleProductToggle = (barcode) => {
    if (!barcode) return;

    const productsArrayList = Array.isArray(productsArray)
      ? [...productsArray]
      : typeof productsArray === "string"
      ? productsArray.split(",").map((item) => item.trim())
      : [];

    const index = productsArrayList.indexOf(barcode);

    if (index !== -1) {
      productsArrayList.splice(index, 1);
    } else {
      productsArrayList.push(barcode);
    }

    setProductsArray(productsArrayList);
  };

  function getVideo(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedVideo(file);

      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        setVideoDuration(Math.round(video.duration));
      };

      video.src = URL.createObjectURL(file);
    } else {
      setSelectedVideo(null);
      setVideoDuration(null);
    }
  }

  function getMobileVideo(e) {
    const file = e.target.files[0];
    setSelectedMobileVideo(file || null);
  }

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Новый совет</h2>
      </div>
      <div className="center-col w-full">
        <div className="dark:bg-darkTwo w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(createBannerRequest)}
            className="form-holder mb-2"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (тм):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Оглавление (тм)"
                {...register("headerTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (ру):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Оглавление (ру)"
                {...register("headerRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Описание (тм):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Описание (тм)"
                {...register("descriptionTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Описание (ру):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Описание (ру)"
                {...register("descriptionRu")}
              />
            </div>
            <Field className="flex flex-col w-full">
              <Description className="min-w-32">
                Отзыв блогера (тм.):
              </Description>
              <Textarea
                {...register("contentTm")}
                className={clsx(
                  "bg-white dark:bg-darkTwo basic-border-2 rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-14 w-full",
                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                )}
                placeholder="Отзыв (тм.)"
                defaultValue=""
                rows={3}
              />
            </Field>
            <Field className="flex flex-col w-full">
              <Description className="min-w-32">
                Отзыв блогера (ру):
              </Description>
              <Textarea
                {...register("contentRu")}
                className={clsx(
                  "bg-white dark:bg-darkTwo basic-border-2 rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-14 w-full",
                  "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                )}
                placeholder="Отзыв (ру)"
                defaultValue=""
                rows={3}
              />
            </Field>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500 font-bold">* </span>
                Дата начала:
              </p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Дата начала"
                {...register("startDate")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500 font-bold">* </span>Дата
                окончания:
              </p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Дата окончания"
                {...register("endDate")}
              />
            </div>

            <div className="bg-blue-200 dark:bg-dark rounded p-2 w-full">
              <p>
                Выберите одну из опций: категорию, подкатегорию или сегмент,
                чтобы прикрепить ссылку.
              </p>
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Категория:</p>
              <CategoryPicker passedProp={categoryIdRef} data={{}} />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Подкатегория:</p>
              <SubCategoryPicker passedProp={subCategoryIdRef} data={{}} />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Сегмент:</p>
              <SegmentPicker passedProp={segmentIdRef} data={{}} />
            </div>
            {/* <ProductPicker passedProp={productBarcodeRef} data={{}} /> */}
            <div label="Hashtags" className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Список товаров</p>
              <input
                type="text"
                placeholder="Введите баркоды товаров, с запятой"
                value={productsArray}
                onChange={handleProductsArrayChange}
                className="input-primary px-2"
              />
            </div>

            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">
                Медиа для компютеров
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-4 w-full">
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-1/2">
                  <p className="text-center">Размер изображения 2000 x 1000</p>
                  {selectedImage ? (
                    <div className="rounded relative block h-[100px] md:h-[200px] w-[175px] md:w-[350px]">
                      {selectedImage && selectedImage instanceof File && (
                        <Image
                          src={URL.createObjectURL(selectedImage)}
                          alt="image"
                          className="rounded object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                          fill
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded center-col relative h-52 max-h-52 w-full">
                      <ImagePlus className="text-dark dark:text-support size-10" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="posterImage"
                    onChange={getFile}
                    accept="image/*"
                    placeholder="Добавить фото"
                    className="custom-file-input"
                  />
                </div>
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-1/2">
                  <div className="text-center">
                    <p>Макс размер видео: ~20MB (mp4)</p>
                    {videoDuration && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Длительность: {videoDuration} сек
                      </p>
                    )}
                  </div>
                  {selectedVideo ? (
                    <video
                      className="rounded object-contain w-full max-h-52"
                      controls
                      src={URL.createObjectURL(selectedVideo)}
                    />
                  ) : (
                    <div className="rounded center-col relative h-52 max-h-52 w-full">
                      <ImagePlus className="text-dark dark:text-support size-10" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="video"
                    onChange={getVideo}
                    accept="video/mp4,video/webm,video/ogg"
                    placeholder="Добавить видео"
                    className="custom-file-input"
                  />
                </div>
              </div>
            </div>
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-2">
                Медиа для мобильных устройств
              </h3>
              <div className="flex flex-col md:flex-row md:justify-between gap-2 mb-2 w-full">
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-1/2">
                  <p className="text-center">Мобильное изображение</p>
                  {selectedMobileImage ? (
                    <div className="rounded relative block h-[100px] md:h-[200px] w-[175px] md:w-[350px]">
                      {selectedMobileImage &&
                        selectedMobileImage instanceof File && (
                          <Image
                            src={URL.createObjectURL(selectedMobileImage)}
                            alt="mobile image"
                            className="rounded object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                            fill
                          />
                        )}
                    </div>
                  ) : (
                    <div className="rounded center-col relative h-52 max-h-52 w-full">
                      <ImagePlus className="text-dark dark:text-support size-10" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="mobileImage"
                    onChange={getMobileFile}
                    accept="image/*"
                    placeholder="Добавить мобильное фото"
                    className="custom-file-input"
                  />
                </div>
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-1/2">
                  <p className="text-center">Мобильное видео (mp4)</p>
                  {selectedMobileVideo ? (
                    <video
                      className="rounded object-contain w-full max-h-52"
                      controls
                      src={URL.createObjectURL(selectedMobileVideo)}
                    />
                  ) : (
                    <div className="rounded center-col relative h-52 max-h-52 w-full">
                      <ImagePlus className="text-dark dark:text-support size-10" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="mobileVideo"
                    onChange={getMobileVideo}
                    accept="video/mp4,video/webm,video/ogg"
                    placeholder="Добавить мобильное видео"
                    className="custom-file-input"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-row mb-2 gap-2 w-full">
              <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                <p className="w-32">Совет активен:</p>
                <Switch
                  checked={isActive}
                  onChange={() => {
                    setIsActive(!isActive);
                  }}
                  className="group relative flex cursor-pointer rounded-full bg-support-100 dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                  />
                </Switch>
              </div>
              <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                <PlusIcon className="size-5" />
                <span className="font-semibold text-sm md:text-base">
                  Добавить
                </span>
              </button>
            </div>
          </form>

          <ProductsList
            productsArray={productsArray}
            onProductToggle={handleProductToggle}
          />
        </div>
      </div>
    </div>
  );
}
