"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import Image from "next/image";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { PackagePlus, ImagePlus } from "lucide-react";

export default function NewBrandPage() {
  const [selectedImage, setSelectedImage] = useState();
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  const createNewBrandRequest = async (data) => {
    if (!data.name) {
      ErrorToast({
        errorText: "Дайте название бренду.",
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
      formData.append("image", selectedImage);
      formData.append("isActive", true);

      const response = await fetch(`${apiUrl}/brands/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Бренд добавлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый бренд : ${data.name}`,
          "CREATE"
        );

        setTimeout(() => {
          NProgress.start();
          router.push("/home/brands");
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
        <h2>Новый бренд</h2>
      </div>
      <div className="center-col">
        <div className="rounded flex flex-col gap-2 w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(createNewBrandRequest)}
            className="basic-border flex flex-col gap-2 p-2 w-full"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500">* </span>Имя:
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-4 w-full"
                defaultValue=""
                placeholder="Имя бренда"
                {...register("name")}
              />
            </div>
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-dark basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p>Рекомендуемый размер изображения 400 x 400</p>
                {selectedImage ? (
                  <div className="center-col relative block h-[250px] w-[250px]">
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
                ) : (
                  <div className="center-col h-[250px] w-[250px]">
                    <ImagePlus className="text-dark size-12" />
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
                <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                  <PackagePlus className="size-5" />
                  <span className="font-semibold">Добавить</span>
                </button>
                <div className="border-t border-support-200 pt-2 mt-auto">
                  <p>
                    Рекомендуем выложить изображения не больше 1ого мегабайта.
                  </p>
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
