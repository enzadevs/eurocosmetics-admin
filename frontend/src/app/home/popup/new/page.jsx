"use client";

import Image from "next/image";
import BackForthButtons from "@/components/nav/BackForthButtons";
import CategoryPicker from "@/components/pickers/CategoryPicker";
import SubCategoryPicker from "@/components/pickers/SubCategoryPicker";
import SegmentPicker from "@/components/pickers/SegmentPicker";
import ProductPicker from "@/components/pickers/ProductPicker";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useRef } from "react";
import { Switch } from "@headlessui/react";
import { PlusIcon, ImagePlus } from "lucide-react";

export default function NewPopUpPage() {
  const [selectedImage, setSelectedImage] = useState();
  const [isActive, setIsActive] = useState(true);
  const { register, handleSubmit } = useForm();
  const categoryIdRef = useRef(null);
  const subCategoryIdRef = useRef(null);
  const segmentIdRef = useRef(null);
  const productBarcodeRef = useRef(null);
  const router = useRouter();
  const { admin } = useAdminStore();

  const createPopUpRequest = async (data) => {
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

    if (!selectedImage) {
      ErrorToast({ errorText: "Пожалуйста, загрузите изображение." });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("isActive", isActive);
      formData.append("countdown", data.countdown || 0);
      formData.append("image", selectedImage);
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

      const response = await fetch(`${apiUrl}/popup/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлен PopUp." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал PopUp : ${data.name}`,
          "CREATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/popup");
        }, 1000);
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

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Новый PopUp</h2>
      </div>
      <div className="center-col w-full">
        <div className="dark:bg-darkTwo w-full max-w-2xl">
          <form
            onSubmit={handleSubmit(createPopUpRequest)}
            className="form-holder"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Описание:</p>
              <input
                type="text"
                className="input-primary dark:text-primary px-4 w-full"
                defaultValue=""
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
            <ProductPicker passedProp={productBarcodeRef} data={{}} />
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p className="text-center">Размер изображения 500 x 1000</p>
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
                    <ImagePlus className="text-dark dark:text-white size-10" />
                  </div>
                )}
                <input
                  type="file"
                  name="posterImage"
                  onChange={getFile}
                  multiple
                  accept="image/*"
                  placeholder="Добавить фото"
                  className="custom-file-input"
                ></input>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-[40%]">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">PopUp активен:</p>
                  <Switch
                    checked={isActive}
                    onChange={() => {
                      setIsActive(!isActive);
                    }}
                    className="group relative flex cursor-pointer rounded-full bg-support dark:bg-dark p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
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
        </div>
      </div>
    </div>
  );
}
