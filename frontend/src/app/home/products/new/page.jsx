"use client";

import * as NProgress from "nprogress";
import clsx from "clsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import CategorySelectorP from "@/components/selectors/CategorySelectorP";
import ProductStatusSelectorP from "@/components/selectors/ProductStatusSelectorP";
import UnitSelectorP from "@/components/selectors/UnitSelectorP";
import DiscountSelector from "@/components/selectors/DiscountSelector";
import ProductSwiper from "@/components/containers/ProductSwiper";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Switch, Textarea, Field, Description } from "@headlessui/react";
import { PackagePlus, ImagePlus } from "lucide-react";

export default function NewProductPage() {
  const [isActive, setIsActive] = useState(true);
  const [productImages, setProductImages] = useState([
    null,
    null,
    null,
    null,
    null,
  ]);
  const { register, handleSubmit, watch } = useForm();
  const { admin } = useAdminStore();
  const [finalPrice, setFinalPrice] = useState(0);
  const [hashtags, setHashtags] = useState("");
  const brandIdRef = useRef(null);
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productStatusIdRef = useRef(null);
  const unitRef = useRef(null);
  const discountTypeRef = useRef(null);
  const discountValueRef = useRef(null);
  const router = useRouter();

  const currentSellPrice = watch("sellPrice", "");

  const imageFields = [
    "imageOne",
    "imageTwo",
    "imageThree",
    "imageFour",
    "imageFive",
  ];

  const createNewProductRequest = async (data) => {
    const validateField = (field, errorMessage) => {
      if (
        (typeof field === "string" && field.trim() === "") ||
        (typeof field !== "string" && !field)
      ) {
        ErrorToast({ errorText: errorMessage });
        return false;
      }
      return true;
    };

    const validations = [
      { field: data.barcode, error: "Поле 'Баркод' не может быть пустым." },
      { field: data.stock, error: "Поле 'Количество' не может быть пустым." },
      {
        field: data.nameTm,
        error: "Имя товара на туркменском не может быть пустым.",
      },
      {
        field: data.nameRu,
        error: "Имя товара на русском не может быть пустым.",
      },
      {
        field: data.incomePrice,
        error: "Поле 'Цена(приход)' не может быть пустым.",
      },
      {
        field: data.sellPrice,
        error: "Поле 'Цена(продажа)' не может быть пустым.",
      },
      { field: categoryIdRef.current, error: "Выберите категорию." },
      { field: subCategoryIdRef.current, error: "Выберите подкатегорию." },
      { field: unitRef.current, error: "Выберите единицу измерения." },
    ];

    for (let validation of validations) {
      if (!validateField(validation.field, validation.error)) {
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("barcode", data.barcode);
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      formData.append("incomePrice", data.incomePrice);
      formData.append("sellPrice", data.sellPrice);
      formData.append("currentSellPrice", finalPrice);
      formData.append("stock", data.stock);
      formData.append("limit", data.limit);
      formData.append("order", data.order);
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
      productImages.forEach((image, index) => {
        formData.append(imageFields[index], image || "");
      });

      const hashtagArray = hashtags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      formData.append("hashtags", JSON.stringify(hashtagArray));

      const response = await fetch(`${apiUrl}/products/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Товар добавлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый товар : ${data.nameRu}. Баркод : ${data.barcode}`,
          "CREATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/products");
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
        <h2>Новый товар</h2>
      </div>
      <div className="center-col">
        <div className="flex flex-col gap-2 w-full max-w-5xl">
          <form
            onSubmit={handleSubmit(createNewProductRequest)}
            className="form-holder"
          >
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Баркод:
                </p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue=""
                  placeholder="Баркод"
                  {...register("barcode")}
                />
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                <div className="center-row gap-1 w-full">
                  <p className="min-w-32 md:min-w-14">
                    <span className="text-red-500">* </span>Кол.
                  </p>
                  <input
                    type="text"
                    className="input-primary dark:text-support px-2 w-full"
                    defaultValue="0"
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
                    className="input-primary dark:text-support px-4"
                    defaultValue="0"
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
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Имя ткм
                </p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue=""
                  placeholder="Имя ткм"
                  {...register("nameTm")}
                />
              </div>
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Имя рус
                </p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue=""
                  placeholder="Имя рус"
                  {...register("nameRu")}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Цена (приход)
                </p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue="0"
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
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Цена (продажа)
                </p>
                <input
                  type="text"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue="0"
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
              currentSellPrice={currentSellPrice}
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
                  className="input-primary px-2"
                />
              </Field>
              <div className="center-row gap-1 w-full md:w-1/2">
                <p className="min-w-32">Номер:</p>
                <input
                  type="number"
                  className="input-primary dark:text-support px-2 w-full"
                  defaultValue=""
                  placeholder="Номер"
                  {...register("order")}
                />
              </div>
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
                  defaultValue=""
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
                  defaultValue=""
                  rows={4}
                />
              </Field>
            </div>
            <div className="center-row gap-1 w-full">
              <CategorySelectorP
                categoryIdRef={categoryIdRef}
                subCategoryIdRef={subCategoryIdRef}
                segmentIdRef={segmentIdRef}
              />
            </div>
            <div className="border-b border-support-200 flex flex-col md:flex-row gap-2 pb-2 w-full">
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">
                  <span className="text-red-500">* </span>Единица
                </p>
                <UnitSelectorP unitRef={unitRef} />
              </div>
              <div className="center-row gap-1 w-full">
                <p className="min-w-32">Статус</p>
                <ProductStatusSelectorP
                  productStatusIdRef={productStatusIdRef}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                  <p className="text-center">
                    Размер изображения 700 x 700. Загрузите от 1-ого до 5-и
                    изображений.
                  </p>
                  {productImages.some((img) => img !== null) ? (
                    <ProductSwiper
                      images={productImages.filter((img) => img !== null)}
                    />
                  ) : (
                    <div className="center-col h-[250px] w-[250px]">
                      <ImagePlus className="text-dark size-12" />
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
              </div>
              <div className="flex flex-col gap-2 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark basic-border center-row gap-4 p-2 h-10 w-full">
                  <p className="w-52">Товар доступен:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                    />
                  </Switch>
                </div>
                <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                  <PackagePlus className="size-5" />
                  <span className="font-semibold">Добавить</span>
                </button>
                <div className="border-t border-support-200 pt-2 mt-auto">
                  <p>Рекомендуем выложить изображения не больше 2мб</p>
                  <p className="text-red-500">*(обязательные поля)</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
