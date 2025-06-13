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
import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { Save, Trash2 } from "lucide-react";

const fetchCategoryInfo = async (id) => {
  const response = await fetch(`${apiUrl}/categories/fetch/single/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateCategoryPage({ params }) {
  const [data, setData] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const [selectedCoverImage, setSelectedCoverImage] = useState();
  const [isActive, setIsActive] = useState(false);
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getCategoryData = async () => {
      const response = await fetchCategoryInfo(params.id);
      setData(response);
      setIsActive(response?.isActive);
    };

    getCategoryData();
  }, [params.id]);

  const updateData = async (data) => {
    try {
      const formData = new FormData();
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      formData.append("order", data.order || data?.order);
      formData.append("deliveryPrice", data.deliveryPrice);
      formData.append("isActive", isActive);
      formData.append("image", selectedImage ? selectedImage : "");
      formData.append("coverImage", selectedCoverImage);

      const response = await fetch(`${apiUrl}/categories/update/${params.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Категория обновлена." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил категорию с ID : ${params.id}`,
          "UPDATE"
        );

        NProgress.start();
        router.push("/home/categories");
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
      const response = await fetch(`${apiUrl}/categories/delete/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Категория удалена." });
        setTimeout(() => {
          NProgress.start();
          router.push("/home/categories");
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
    if (window.confirm(`Вы уверены, что хотите удалить категорию?`)) {
      handleDelete();
    }
  };

  function getFile(e) {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  }

  function getCoverFile(e) {
    const file = e.target.files[0];
    setSelectedCoverImage(file || null);
  }

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Обновить категорию</h2>
      </div>
      <div className="center-col">
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit(updateData)} className="form-holder">
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500">* </span>Имя (ткм):
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-2"
                defaultValue={data?.nameTm}
                placeholder="Имя категории (ткм.)"
                {...register("nameTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">
                <span className="text-red-500">* </span>Имя (ру):
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-2"
                defaultValue={data?.nameRu}
                placeholder="Имя категории (ру.)"
                {...register("nameRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue={data?.order}
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <>
              {params?.id === "6518dba0-f9c4-4264-9fa9-4f37c49ca328" ? (
                <div className="center-row gap-1 w-full">
                  <p className="min-w-24 md:min-w-32">Цена доставки:</p>
                  <input
                    type="number"
                    className="input-primary dark:text-support px-2 w-full"
                    defaultValue={data?.deliveryPrice}
                    placeholder="Цена доставки"
                    {...register("deliveryPrice")}
                  />
                </div>
              ) : (
                <></>
              )}
            </>
            <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
              <p className="text-center">Иконка 250 x 250</p>
              {selectedImage ? (
                <div className="center-col relative block h-40 w-40">
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
                <div className="center-col relative h-40 w-40">
                  <img
                    src={apiUrl + "/" + data.image}
                    alt="image of category"
                    className="object-contain h-40 w-40"
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
            <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
              <p className="text-center">Обложка 1440 x 700</p>
              {selectedCoverImage ? (
                <div className="center-col relative block h-72 w-full">
                  {selectedCoverImage && selectedCoverImage instanceof File && (
                    <Image
                      src={URL.createObjectURL(selectedCoverImage)}
                      alt="image"
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                      fill
                    />
                  )}
                </div>
              ) : (
                <div className="center-col relative h-72 w-full">
                  <img
                    src={apiUrl + "/" + data.coverImage}
                    alt="image of category"
                    className="object-contain h-72 w-full"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <input
                type="file"
                name="coverImage"
                onChange={getCoverFile}
                multiple
                accept="image/*"
                placeholder="Добавить фото"
                className="custom-file-input"
              ></input>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                <p className="w-40">Категория доступна:</p>
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
              <div className="center-row gap-2">
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
