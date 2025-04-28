"use client";

import * as NProgress from "nprogress";
import clsx from "clsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import CategorySelectorP from "@/components/selectors/CategorySelectorP";
import ProductStatusSelectorP from "@/components/selectors/ProductStatusSelectorP";
import UnitSelectorP from "@/components/selectors/UnitSelectorP";
import DiscountSelector from "@/components/selectors/DiscountSelector";
import ProductSwiper from "@/components/containers/ProductSwiper";
import ImagesSwiper from "@/components/containers/ImagesSwiper";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { Switch, Textarea, Field, Description } from "@headlessui/react";
import { Save } from "lucide-react";
import Link from "next/link";

const fetchProductInfo = async (barcode) => {
  const response = await fetch(`${apiUrl}/products/admin/${barcode}`);
  const data = await response.json();
  return data;
};

export default function UpdateProductPage({ params }) {
  const [productData, setProductData] = useState([]);
  const [productImages, setProductImages] = useState([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [productImagesServer, setProductImagesServer] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [unitData, setUnitData] = useState(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [hashtags, setHashtags] = useState("");
  const [initialHashtags, setInitialHashtags] = useState("");
  const { register, handleSubmit, watch } = useForm();
  const { admin } = useAdminStore();
  const brandIdRef = useRef(null);
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productStatusIdRef = useRef(null);
  const unitRef = useRef(null);
  const discountTypeRef = useRef(null);
  const discountValueRef = useRef(null);
  const router = useRouter();
  const sellPrice = watch("sellPrice");

  useEffect(() => {
    const getProductInfo = async () => {
      const response = await fetchProductInfo(params.barcode);
      setProductData(response);
      setIsActive(response?.isActive);

      const unitObject = {
        Piece: { id: 1, value: "Piece", nameRu: "Штук" },
        Kg: { id: 2, value: "Kg", nameRu: "Кг." },
        Litre: { id: 3, value: "Litre", nameRu: "Литр" },
      }[response.unit];

      const imagesArray = [
        response.imageOne,
        response.imageTwo,
        response.imageThree,
        response.imageFour,
        response.imageFive,
      ].filter((img) => img !== null);

      setProductImagesServer(imagesArray);
      setUnitData(unitObject);

      discountTypeRef.current = response?.discountType;
      discountValueRef.current = response?.discountValue;
      setHashtags(response?.hashtags);
      setInitialHashtags(response?.hashtags);
    };

    getProductInfo();
  }, [params.barcode]);

  const imageFields = [
    "imageOne",
    "imageTwo",
    "imageThree",
    "imageFour",
    "imageFive",
  ];

  const updateProductRequest = async (data) => {
    try {
      const formData = new FormData();
      formData.append("newBarcode", data.barcode);
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      formData.append(
        "incomePrice",
        data.incomePrice || productData?.incomePrice || 0
      );
      formData.append(
        "sellPrice",
        data.sellPrice || productData?.sellPrice || 0
      );
      formData.append(
        "currentSellPrice",
        finalPrice || productData?.currentSellPrice || 0
      );
      formData.append("stock", data.stock || productData?.stock);
      formData.append("order", data.order || productData?.order);
      formData.append(
        "limit",
        data.limit !== undefined && data.limit !== null
          ? data.limit
          : productData?.limit
      );

      formData.append("descriptionTm", data.descriptionTm || "");
      formData.append("descriptionRu", data.descriptionRu || "");
      formData.append("brandId", brandIdRef.current);
      formData.append("categoryId", categoryIdRef.current);
      formData.append("subCategoryId", subCategoryIdRef.current);
      formData.append("segmentId", segmentIdRef.current);
      formData.append("unit", unitRef.current);
      formData.append("productStatusId", productStatusIdRef.current || 1);
      formData.append("discountType", discountTypeRef.current);
      formData.append("discountValue", discountValueRef.current);
      formData.append("isActive", isActive);
      if (Array.isArray(productImages) && productImages.length > 0) {
        productImages.forEach((image, index) => {
          if (image) {
            formData.append(imageFields[index], image);
          }
        });
      }

      if (hashtags !== initialHashtags) {
        const hashtagArray = hashtags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        formData.append("hashtags", JSON.stringify(hashtagArray));
      }

      const response = await fetch(
        `${apiUrl}/products/update/${params.barcode}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        SuccessToast({ successText: "Товар обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил товар с баркодом : ${params.barcode}`,
          "UPDATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.back();
        }, 1000);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newProductImages = [...productImages];
      newProductImages[index] = file;
      setProductImages(newProductImages);
    }
  };

  const handleHashtagChange = (e) => {
    setHashtags(e.target.value);
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Обновить товар</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="rounded flex flex-col gap-2 w-full md:w-3/4">
          <form
            onSubmit={handleSubmit(updateProductRequest)}
            className="basic-border flex flex-col gap-2 p-2 h-fit w-full"
          >
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">Баркод:</p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2"
                  defaultValue={productData?.barcode}
                  placeholder="Баркод"
                  {...register("barcode")}
                />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                <div className="center-row gap-1 w-full">
                  <p className="min-w-32 md:min-w-14">Кол.</p>
                  <input
                    type="text"
                    className="input-primary dark:text-support px-2"
                    defaultValue={
                      productData?.stock
                        ? parseFloat(productData.stock).toFixed(2)
                        : ""
                    }
                    placeholder="Количество"
                    {...register("stock", {
                      validate: (value) => {
                        if (isNaN(value)) {
                          ErrorToast({
                            errorText:
                              "Пожалуйста, введите число в количество.",
                          });
                          return false;
                        }
                        return true;
                      },
                    })}
                  />
                </div>
                <div className="center-row gap-1 w-full">
                  <p className="min-w-32 md:min-w-14">Лимит:</p>
                  <input
                    type="text"
                    className="input-primary dark:text-support px-2"
                    defaultValue={productData?.limit}
                    placeholder="Лимит"
                    {...register("limit", {
                      validate: (value) => {
                        if (isNaN(value)) {
                          ErrorToast({
                            errorText:
                              "Пожалуйста, введите число в поле лимит.",
                          });
                          return false;
                        }
                        return true;
                      },
                    })}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">Цена(приход):</p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2"
                  defaultValue={productData?.incomePrice}
                  placeholder="Цена (приход)"
                  {...register("incomePrice", {
                    validate: (value) => {
                      if (isNaN(value)) {
                        ErrorToast({
                          errorText: "Пожалуйста, введите число в поле приход.",
                        });
                        return false;
                      }
                      return true;
                    },
                  })}
                />
              </div>
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">Цена (продажа):</p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2"
                  defaultValue={productData?.sellPrice}
                  placeholder="Цена (продажа)"
                  {...register("sellPrice", {
                    validate: (value) => {
                      if (isNaN(value)) {
                        ErrorToast({
                          errorText:
                            "Пожалуйста, введите число в поле продажа.",
                        });
                        return false;
                      }
                      return true;
                    },
                  })}
                />
              </div>
            </div>
            <DiscountSelector
              discountTypeRef={discountTypeRef}
              discountValueRef={discountValueRef}
              currentSellPrice={sellPrice}
              setFinalPrice={setFinalPrice}
            />
            <div className="flex flex-col md:flex-row gap-1 mt-2">
              <Field
                label="Hashtags"
                className="center-row gap-1 w-full md:w-1/2"
              >
                <Description className="min-w-32">Хештеги</Description>
                <input
                  type="text"
                  placeholder="Введите хештегы, с запятой"
                  value={hashtags}
                  onChange={handleHashtagChange}
                  className="input-primary dark:text-support px-2"
                />
              </Field>
              <div className="center-row gap-1 w-full md:w-1/2">
                <p className="min-w-32">Номер:</p>
                <input
                  type="number"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue={productData?.order}
                  placeholder="Номер"
                  {...register("order")}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Field className="flex flex-col w-full">
                <Description className="min-w-32">Имя (ткм.):</Description>
                <Textarea
                  {...register("nameTm")}
                  className={clsx(
                    "bg-white dark:bg-darkTwo basic-border rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-20 w-full",
                    "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                  )}
                  placeholder="Имя товара (ткм.)"
                  defaultValue={productData?.nameTm}
                  rows={2}
                />
              </Field>
              <Field className="flex flex-col w-full">
                <Description className="min-w-32">Имя (рус.):</Description>
                <Textarea
                  {...register("nameRu")}
                  className={clsx(
                    "bg-white dark:bg-darkTwo basic-border rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-20 w-full",
                    "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                  )}
                  placeholder="Имя товара (рус.)"
                  defaultValue={productData?.nameRu}
                  rows={2}
                />
              </Field>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <Field className="flex flex-col w-full">
                <Description className="min-w-32">Описание (ткм.)</Description>
                <Textarea
                  {...register("descriptionTm")}
                  className={clsx(
                    "bg-white dark:bg-darkTwo basic-border rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-20 w-full",
                    "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                  )}
                  placeholder="Описание (ткм.)"
                  defaultValue={productData?.descriptionTm}
                  rows={4}
                />
              </Field>
              <Field className="flex flex-col w-full">
                <Description className="min-w-32">Описание (ру.)</Description>
                <Textarea
                  {...register("descriptionRu")}
                  className={clsx(
                    "bg-white dark:bg-darkTwo basic-border rounded text-dark dark:text-support block resize-y transition-all py-2 px-2 min-h-20 w-full",
                    "data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-primary"
                  )}
                  placeholder="Описание (ру.)"
                  defaultValue={productData?.descriptionRu}
                  rows={4}
                />
              </Field>
            </div>
            <CategorySelectorP
              categoryIdRef={categoryIdRef}
              subCategoryIdRef={subCategoryIdRef}
              segmentIdRef={segmentIdRef}
              data={productData}
            />
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p className="text-center">
                  Размер изображения 700 x 700. Максимум 5 изображений.
                </p>
                {productImages.some((img) => img !== null) ? (
                  <ProductSwiper
                    images={productImages?.filter((img) => img !== null)}
                  />
                ) : (
                  <div className="center-col h-fit w-full">
                    <ImagesSwiper images={productImagesServer} />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div
                      key={num}
                      className="flex flex-col items-center w-full"
                    >
                      <div className="relative w-full">
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(e, num - 1)}
                          accept="image/*"
                          id={`productImage${num}`}
                          className="custom-file-input-2"
                        />
                        <label
                          htmlFor={`productImage${num}`}
                          className="file-input-label"
                        >
                          Картина {num}
                        </label>
                      </div>
                      {productImages[num - 1] && (
                        <p className="text-sm mt-1 max-w-[50px] line-clamp-1">
                          {productImages[num - 1].name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-[40%]">
                <div className="center-row gap-1 w-full">
                  <p className="min-w-32">Единица:</p>
                  <UnitSelectorP unitRef={unitRef} data={unitData} />
                </div>
                <div className="center-row gap-1 w-full">
                  <p className="min-w-32">Статус:</p>
                  <ProductStatusSelectorP
                    productStatusIdRef={productStatusIdRef}
                    data={productData?.Status}
                  />
                </div>
                <div className="bg-white dark:bg-dark basic-border center-row gap-4 p-2 h-10 w-full">
                  <p className="text-dark w-52">Товар доступен:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support-100 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                    />
                  </Switch>
                </div>
                <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                  <Save className="size-5" />
                  <span className="font-semibold">Сохранить</span>
                </button>
                <div className="border-t border-support-200 pt-2 mt-auto">
                  <p>Рекомендуем выложить изображения не больше 2мб</p>
                  <p className="text-red-500">(обязательные поля)</p>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="bg-support-50 basic-border flex flex-col gap-2 p-2 h-fit w-full md:w-1/4">
          <h4 className="font-bold">Заказы с этим товаром :</h4>
          <div className="flex flex-col gap-1 custom-scrollbar overflow-x-auto max-h-[768px]">
            {productData?.OrderItem?.filter(
              (item) => item?.orderId != null && item?.currentSellPrice != null
            ).map((item) => {
              return (
                <Link
                  href={`/home/orders/${item?.orderId}`}
                  target="_blank"
                  key={item.orderId}
                  className="bg-white basic-border flex flex-col hover:bg-support-100 p-1 w-full"
                >
                  <div className="center-row justify-between">
                    <p>Номер заказа :</p>
                    <p className="text-primary font-bold">{item?.orderId}</p>
                  </div>
                  <div className="center-row justify-between">
                    <p>Количество</p>
                    <p className="font-medium">{item?.quantity}</p>
                  </div>
                  <div className="center-row justify-between">
                    <p>Цена</p>
                    <p className="font-medium">{item?.currentSellPrice}</p>
                  </div>
                  <div className="center-row justify-between">
                    <p>Дата заказа</p>
                    <p className="font-medium">
                      {new Date(item?.Order?.createdAt).toLocaleString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
