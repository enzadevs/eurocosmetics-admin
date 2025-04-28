"use client";

import CategoryPicker from "@/components/pickers/CategoryPicker";
import SubCategoryPicker from "@/components/pickers/SubCategoryPicker";
import SegmentPicker from "@/components/pickers/SegmentPicker";
import ProductPicker from "@/components/pickers/ProductPicker";
import BackForthButtons from "@/components/nav/BackForthButtons";
import ProductsList from "@/components/tables/ProductsList";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Switch } from "@headlessui/react";
import { Save, Trash2 } from "lucide-react";

const fetchBannerData = async (id) => {
  const response = await fetch(`${apiUrl}/banners/fetch/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateBannerPage({ params }) {
  const [bannerData, setBannerData] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const [isActive, setIsActive] = useState(false);
  const [productsArray, setProductsArray] = useState([]);
  const { register, handleSubmit } = useForm();
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productBarcodeRef = useRef(null);
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getBannerData = async () => {
      const response = await fetchBannerData(params.id);
      setBannerData(response);
      setIsActive(response?.isActive);
      setProductsArray(response?.ProductsArray || "");
    };

    getBannerData();
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
      formData.append("order", data.order || bannerData?.order);
      formData.append("isActive", isActive);
      formData.append("categoryId", categoryIdRef.current || null);
      formData.append("subCategoryId", subCategoryIdRef.current || null);
      formData.append("segmentId", segmentIdRef.current || null);
      formData.append("productBarcode", productBarcodeRef.current || null);
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
      formData.append("image", selectedImage);

      const response = await fetch(
        `${apiUrl}/banners/update/${Number(params.id)}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        SuccessToast({ successText: "Баннер обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил баннер с ID : ${params.id}`,
          "UPDATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/banners");
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
      const response = await fetch(`${apiUrl}/banners/delete/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Баннер удален." });
        setTimeout(() => {
          NProgress.start();
          router.push("/home/banners");
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
    if (window.confirm(`Вы уверены, что хотите удалить баннер?`)) {
      handleDelete();
    }
  };

  function getFile(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
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

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Обновить баннер</h2>
      </div>
      <div className="center-col w-full">
        <div className="border border-support-200 rounded dark:bg-darkTwo flex flex-col w-full max-w-3xl">
          <form onSubmit={handleSubmit(updateData)} className="form-holder">
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue={bannerData?.order}
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Описание:</p>
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue={bannerData?.name}
                placeholder="Описание"
                {...register("name")}
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
              <CategoryPicker
                passedProp={categoryIdRef}
                data={
                  bannerData?.link === bannerData?.Category?.id
                    ? bannerData?.Category
                    : {}
                }
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Подкатегория:</p>
              <SubCategoryPicker
                passedProp={subCategoryIdRef}
                data={
                  bannerData?.link === bannerData?.SubCategory?.id
                    ? bannerData?.SubCategory
                    : {}
                }
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Сегмент:</p>
              <SegmentPicker
                passedProp={segmentIdRef}
                data={
                  bannerData?.link === bannerData?.Segment?.id
                    ? bannerData?.Segment
                    : {}
                }
              />
            </div>
            <ProductPicker
              passedProp={productBarcodeRef}
              data={
                bannerData?.link === bannerData?.Product?.barcode
                  ? bannerData?.Product
                  : {}
              }
            />
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
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p className="text-center">
                  Рекомендуемый размер изображения 1000 x 500
                </p>
                {selectedImage ? (
                  <div className="rounded relative block max-h-52 w-full">
                    {selectedImage && selectedImage instanceof File && (
                      <img
                        src={URL.createObjectURL(selectedImage)}
                        alt="image"
                        className="bg-white rounded object-contain h-full w-full"
                      />
                    )}
                  </div>
                ) : (
                  <div className="rounded center-col relative h-52 max-h-52 w-full">
                    <img
                      src={apiUrl + "/" + bannerData.image}
                      alt="image of banner"
                      className="rounded object-contain h-full w-full"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                <input
                  type="file"
                  name="image"
                  onChange={getFile}
                  multiple
                  accept="image/*"
                  placeholder="Добавить фото"
                  className="custom-file-input"
                ></input>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">Баннер активен:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support-100  dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                    />
                  </Switch>
                </div>
                <div className="center-row gap-1">
                  <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                    <Save className="size-5" />
                    <span className="font-semibold">Сохранить</span>
                  </button>
                  <button
                    onClick={(event) => confirmDelete(event)}
                    className="btn-primary center-row justify-center gap-2 px-4 w-full"
                  >
                    <Trash2 className="size-5" />
                    <span className="font-semibold text-sm md:text-base">
                      Удалить
                    </span>
                  </button>
                </div>
                <div className="border-t border-support-200 pt-2 mt-auto">
                  <p>Рекомендуем выложить изображения не больше 2мб</p>
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
