"use client";

import Image from "next/image";
import BackForthButtons from "@/components/nav/BackForthButtons";
import BrandPicker from "@/components/pickers/BrandPicker";
import CategoryPicker from "@/components/pickers/CategoryPicker";
import SubCategoryPicker from "@/components/pickers/SubCategoryPicker";
import SegmentPicker from "@/components/pickers/SegmentPicker";
import ProductPicker from "@/components/pickers/ProductPicker";
import ProductsList from "@/components/tables/ProductsList";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { SuccessToast, ErrorToast, apiUrl } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Switch } from "@headlessui/react";
import { PlusIcon, ImagePlus, VideoIcon, Play, Pause } from "lucide-react";

export default function NewStoryPage() {
  const [selectedImage, setSelectedImage] = useState();
  const [selectedVideo, setSelectedVideo] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const videoRef = useRef(null);
  const { register, handleSubmit } = useForm();
  const [productsArray, setProductsArray] = useState([]);
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productBarcodeRef = useRef(null);
  const brandIdRef = useRef(null);
  const router = useRouter();
  const { admin } = useAdminStore();

  const createStoryRequest = async (data) => {
    const selectedOptions = [
      categoryIdRef.current,
      subCategoryIdRef.current,
      segmentIdRef.current,
      brandIdRef.current,
    ].filter(Boolean);

    if (selectedOptions.length > 1) {
      ErrorToast({
        errorText:
          "Выберите только категорию, подкатегорию, сегмент, бренд или товар чтобы прикрепить ссылку.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("order", data.order);
      formData.append("titleTm", data.titleTm || "");
      formData.append("titleRu", data.titleRu || "");
      formData.append("contentTm", data.contentTm || "");
      formData.append("contentRu", data.contentRu || "");
      formData.append("isActive", isActive);

      if (data.startDate) {
        formData.append("startDate", data.startDate);
      }

      if (data.endDate) {
        formData.append("endDate", data.endDate);
      }

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      if (selectedVideo) {
        formData.append("video", selectedVideo);
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
      if (brandIdRef.current) {
        formData.append("brandId", brandIdRef.current);
      }

      const response = await fetch(`${apiUrl}/stories/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлена история." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новую историю : ${data.name}`,
          "CREATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/stories");
        }, 1000);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  function getImageFile(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  }

  function getVideoFile(e) {
    const file = e.target.files[0];
    setSelectedVideo(file || null);
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

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Новая история</h2>
      </div>
      <div className="center-col w-full">
        <div className="dark:bg-darkTwo w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(createStoryRequest)}
            className="form-holder"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Название:</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Название"
                {...register("name")}
              />
            </div>
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
              <p className="min-w-24 md:min-w-32">Заголовок (TM):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Заголовок на туркменском"
                {...register("titleTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Заголовок (RU):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Заголовок на русском"
                {...register("titleRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Контент (TM):</p>
              <textarea
                className="input-primary px-2 w-full min-h-20"
                defaultValue=""
                placeholder="Контент на туркменском"
                {...register("contentTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Контент (RU):</p>
              <textarea
                className="input-primary px-2 w-full min-h-20"
                defaultValue=""
                placeholder="Контент на русском"
                {...register("contentRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата начала:</p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue=""
                placeholder="Дата начала"
                {...register("startDate")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата окончания:</p>
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
                Выберите одну из опций: категорию, подкатегорию, сегмент, бренд
                или товар, чтобы прикрепить ссылку.
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
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Бренд:</p>
              <BrandPicker passedProp={brandIdRef} data={{}} />
            </div>
            <ProductPicker passedProp={productBarcodeRef} data={{}} />
            <div label="ProductsList" className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Список товаров</p>
              <input
                type="text"
                placeholder="Введите баркоды товаров, с запятой"
                value={productsArray}
                onChange={handleProductsArrayChange}
                className="input-primary px-2"
              />
            </div>
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="flex flex-col gap-2 w-full md:w-[60%]">
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                  <p className="text-center">Изображение</p>
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
                    name="image"
                    onChange={getImageFile}
                    accept="image/*"
                    placeholder="Добавить изображение"
                    className="custom-file-input"
                  ></input>
                </div>
                <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                  <p className="text-center">Видео для истории</p>
                  {selectedVideo ? (
                    <div className="center-col relative block h-[200px] md:h-[300px] w-full">
                      {selectedVideo && selectedVideo instanceof File && (
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            src={URL.createObjectURL(selectedVideo)}
                            className="rounded object-contain w-full h-full"
                            onEnded={() => setIsPlaying(false)}
                          />
                          <button
                            type="button"
                            onClick={togglePlayPause}
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-3"
                          >
                            {isPlaying ? (
                              <Pause className="text-white size-8" />
                            ) : (
                              <Play className="text-white size-8" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded center-col relative h-52 max-h-52 w-full">
                      <VideoIcon className="text-dark dark:text-support size-12" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="video"
                    onChange={getVideoFile}
                    accept="video/*"
                    className="custom-file-input"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">История активна:</p>
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
