"use client";

import Image from "next/image";
import BackForthButtons from "@/components/nav/BackForthButtons";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { Save, Trash2, ImagePlus } from "lucide-react";

const fetchBannerData = async (id) => {
  const response = await fetch(`${apiUrl}/giftcard/fetch/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateBannerPage({ params }) {
  const [bannerData, setBannerData] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const [isActive, setIsActive] = useState(false);
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getBannerData = async () => {
      const response = await fetchBannerData(params.id);
      setBannerData(response);
      setIsActive(response?.isActive);
    };

    getBannerData();
  }, [params.id]);

  const updateData = async (data) => {
    try {
      const formData = new FormData();
      formData.append("headerTm", data.headerTm || bannerData?.headerTm);
      formData.append("headerRu", data.headerRu || bannerData?.headerRu);
      formData.append("link", data.link || bannerData?.link);
      formData.append("order", data.order || bannerData?.order);
      formData.append("isActive", isActive);
      formData.append("startDate", data.startDate || bannerData?.startDate);
      formData.append("endDate", data.endDate || bannerData?.endDate);

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(
        `${apiUrl}/giftcard/update/${Number(params.id)}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        SuccessToast({ successText: "Карта обновлена." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил карту с ID : ${params.id}`,
          "UPDATE"
        );

        NProgress.start();
        router.push("/home/giftcard");
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
      const response = await fetch(`${apiUrl}/giftcard/delete/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Карта удалена." });
        NProgress.start();
        router.push("/home/giftcard");
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
    if (window.confirm(`Вы уверены, что хотите удалить карту?`)) {
      handleDelete();
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
        <h2 className="ml-auto md:ml-0">Обновить карту</h2>
      </div>
      <div className="center-col w-full">
        <div className="dark:bg-darkTwo w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(updateData)}
            className="form-holder mb-2"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Номер:</p>
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue={bannerData?.order || ""}
                placeholder="Номер"
                {...register("order")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (тм):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue={bannerData?.headerTm || ""}
                placeholder="Оглавление (тм)"
                {...register("headerTm")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Оглавление (ру):</p>
              <input
                type="text"
                className="input-primary px-2 w-full"
                defaultValue={bannerData?.headerRu || ""}
                placeholder="Оглавление (ру)"
                {...register("headerRu")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Сумма:</p>
              <input
                type="number"
                className="input-primary px-2 w-full"
                defaultValue={bannerData?.link || ""}
                placeholder="Описание (тм)"
                {...register("link")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата начала:</p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue={
                  bannerData?.startDate
                    ? new Date(bannerData.startDate).toISOString().split("T")[0]
                    : ""
                }
                placeholder="Дата начала"
                {...register("startDate")}
              />
            </div>
            <div className="center-row gap-1 w-full">
              <p className="min-w-24 md:min-w-32">Дата окончания:</p>
              <input
                type="date"
                className="input-primary px-2 w-full"
                defaultValue={
                  bannerData?.endDate
                    ? new Date(bannerData.endDate).toISOString().split("T")[0]
                    : ""
                }
                placeholder="Дата окончания"
                {...register("endDate")}
              />
            </div>
            <div className="flex flex-col md:flex-row gap-1 w-full">
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
                    {bannerData?.image ? (
                      <img
                        src={apiUrl + "/" + bannerData.image}
                        alt="image of banner"
                        className="rounded object-contain h-full w-full"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <ImagePlus className="text-dark dark:text-support size-10" />
                    )}
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
              <div className="flex flex-col mb-2 gap-2 w-full md:w-1/2">
                <div className="bg-white dark:bg-dark basic-border-2 center-row gap-4 p-2 h-9 md:h-10 w-full">
                  <p className="w-32">Карта активна:</p>
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
                <div className="center-row gap-1 w-full">
                  <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                    <Save className="size-5" />
                    <span className="font-semibold text-sm md:text-base">
                      Сохранить
                    </span>
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
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
