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
import { useAdminStore } from "@/components/utils/useAdminStore";
import { SuccessToast, ErrorToast, apiUrl } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Save, Trash2, Play, Pause, VideoIcon, ImagePlus } from "lucide-react";
import { Switch } from "@headlessui/react";

const fetchData = async (id) => {
  const response = await fetch(`${apiUrl}/stories/fetch/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateStoryPage({ params }) {
  const [storyData, setStoryData] = useState({});
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

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData(params.id);
      setIsActive(response?.isActive || false);
      setStoryData(response);
      setProductsArray(response?.ProductsArray || "");
    };

    getData();
  }, [params.id]);

  const updateData = async (data) => {
    const selectedOptions = [
      categoryIdRef.current,
      subCategoryIdRef.current,
      segmentIdRef.current,
      productBarcodeRef.current,
    ].filter(Boolean);

    if (selectedOptions.length > 1) {
      ErrorToast({
        errorText:
          "Выберите только категорию, подкатегорию, сегмент или товар чтобы прикрепить ссылку.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("order", data.order || storyData?.order);
      formData.append("titleTm", data.titleTm || storyData?.titleTm);
      formData.append("titleRu", data.titleRu || storyData?.titleRu);
      formData.append("contentTm", data.contentTm || storyData?.contentTm);
      formData.append("contentRu", data.contentRu || storyData?.contentRu);
      formData.append("isActive", isActive);
      formData.append("categoryId", categoryIdRef.current || null);
      formData.append("subCategoryId", subCategoryIdRef.current || null);
      formData.append("segmentId", segmentIdRef.current || null);
      formData.append("brandId", brandIdRef.current || null);
      formData.append("productBarcode", productBarcodeRef.current || null);
      formData.append("startDate", data.startDate || storyData?.startDate);
      formData.append("endDate", data.endDate || storyData?.endDate);

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

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      if (selectedVideo) {
        formData.append("video", selectedVideo);
      }

      const response = await fetch(`${apiUrl}/stories/update/${params.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "История обновлена." });

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

  const handleDelete = async () => {
    try {
      const response = await fetch(`${apiUrl}/stories/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "История удалена." });
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

  const confirmDelete = (event) => {
    event.preventDefault();
    if (window.confirm(`Вы уверены, что хотите удалить историю?`)) {
      handleDelete();
    }
  };

  function getImage(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  }

  function getVideo(e) {
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

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Обновить историю</h2>
      </div>
      <div className="center-col">
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit(updateData)} className="form-holder">
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Имя истории</p>
              <input
                type="text"
                className="input-primary dark:text-grey-50 px-2 w-full"
                defaultValue={storyData?.name || ""}
                placeholder="Название"
                {...register("name")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер</p>
              <input
                type="number"
                className="input-primary dark:text-grey-50 px-2 w-full"
                defaultValue={storyData?.order || ""}
                placeholder="Порядковый номер"
                {...register("order")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Заголовок (TM)</p>
              <textarea
                className="input-primary dark:text-grey-50 px-2 w-full min-h-16"
                defaultValue={storyData?.titleTm || ""}
                placeholder="Заголовок на туркменском"
                {...register("titleTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Заголовок (RU)</p>
              <textarea
                className="input-primary dark:text-grey-50 px-2 w-full min-h-16"
                defaultValue={storyData?.titleRu || ""}
                placeholder="Заголовок на русском"
                {...register("titleRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Контент (TM)</p>
              <textarea
                className="input-primary dark:text-grey-50 px-2 w-full min-h-16"
                defaultValue={storyData?.contentTm || ""}
                placeholder="Контент на туркменском"
                {...register("contentTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Контент (RU)</p>
              <textarea
                className="input-primary dark:text-grey-50 px-2 w-full min-h-16"
                defaultValue={storyData?.contentRu || ""}
                placeholder="Контент на русском"
                {...register("contentRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата начала</p>
              <input
                type="datetime-local"
                className="input-primary dark:text-grey-50 px-2 w-full"
                defaultValue={formatDateForInput(storyData?.startDate)}
                {...register("startDate")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата окончания</p>
              <input
                type="datetime-local"
                className="input-primary dark:text-grey-50 px-2 w-full"
                defaultValue={formatDateForInput(storyData?.endDate)}
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
                <div className="bg-support dark:bg-dark-secondary basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                  <p className="text-center">Изображение</p>
                  {selectedImage ? (
                    <div className="center-col relative block h-[100px] md:h-[200px] w-[175px] md:w-[350px]">
                      {selectedImage && selectedImage instanceof File && (
                        <Image
                          src={URL.createObjectURL(selectedImage)}
                          alt="image"
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                          fill
                        />
                      )}
                    </div>
                  ) : storyData?.image ? (
                    <div className="bg-white dark:bg-dark-accent center-col relative h-[100px] md:h-[200px] w-[175px] md:w-[350px]">
                      <img
                        src={`${apiUrl}/${storyData.image}`}
                        alt="image"
                        className="object-contain h-full w-full"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div className="center-col h-32 w-32">
                      <ImagePlus className="text-dark dark:text-grey-50 size-12" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="image"
                    onChange={getImage}
                    accept="image/*"
                    className="custom-file-input"
                  />
                </div>
                <div className="bg-support dark:bg-dark-secondary basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                  <p className="text-center">Видео для истории</p>
                  {selectedVideo ? (
                    <div className="center-col relative block h-[200px] md:h-[300px] w-full">
                      {selectedVideo && selectedVideo instanceof File && (
                        <div className="relative w-full h-full">
                          <video
                            ref={videoRef}
                            src={URL.createObjectURL(selectedVideo)}
                            className="object-contain w-full h-full"
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
                  ) : storyData?.video ? (
                    <div className="center-col relative block h-[200px] md:h-[300px] w-full">
                      <div className="relative w-full h-full">
                        <video
                          ref={videoRef}
                          src={`${apiUrl}/${storyData.video}`}
                          className="object-contain w-full h-full"
                          onEnded={() => setIsPlaying(false)}
                          crossOrigin="anonymous"
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
                    </div>
                  ) : (
                    <div className="center-col h-32 w-32">
                      <VideoIcon className="text-dark dark:text-grey-50 size-12" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="video"
                    onChange={getVideo}
                    accept="video/*"
                    className="custom-file-input"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark-accent basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">История активна:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="bg-grey-100 group relative flex cursor-pointer rounded-full dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                    />
                  </Switch>
                </div>
                <div className="center-row gap-2 mt-4">
                  <button className="btn-primary center-row justify-center gap-2 px-2 w-full">
                    <Save className="size-5" />
                    <span className="font-semibold">Сохранить</span>
                  </button>
                  <button
                    onClick={(event) => confirmDelete(event)}
                    className="btn-primary center-row justify-center gap-2 px-2 w-full"
                  >
                    <Trash2 className="size-5" />
                    <span className="font-semibold text-sm md:text-base">
                      Удалить
                    </span>
                  </button>
                </div>

                <div className="border-0 md:border-t border-grey-200 pt-2 mt-auto">
                  <p>Рекомендуем видео не больше 10 мегабайт.</p>
                  <p>Изображение-заставка не больше 1 мегабайта.</p>
                </div>
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
