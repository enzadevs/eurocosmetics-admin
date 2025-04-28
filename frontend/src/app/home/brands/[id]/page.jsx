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
import { Save, Trash2 } from "lucide-react";

const fetchData = async (id) => {
  const response = await fetch(`${apiUrl}/brands/fetch/single/${id}`);
  const data = await response.json();
  return data;
};

export default function UpdateBrandPage({ params }) {
  const [data, setData] = useState([]);
  const [selectedImage, setSelectedImage] = useState();
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchData(params.id);
      setData(response);
    };

    getData();
  }, [params.id]);

  const updateData = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("image", selectedImage);
      formData.append("isActive", true);

      const response = await fetch(`${apiUrl}/brands/update/${params.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Бренд обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил бренд с ID : ${params.id}`,
          "UPDATE"
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

  const handleDelete = async () => {
    try {
      const response = await fetch(`${apiUrl}/brands/delete/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Бренд удален." });
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

  const confirmDelete = (event) => {
    event.preventDefault();
    if (window.confirm(`Вы уверены, что хотите удалить бренд?`)) {
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
        <h2>Обновить бренд</h2>
      </div>
      <div className="center-col">
        <div className="rounded flex flex-col gap-2 w-full max-w-3xl">
          <form
            onSubmit={handleSubmit(updateData)}
            className="basic-border flex flex-col gap-2 p-2 w-full"
          >
            <div className="center-row gap-1 w-full">
              <p className="min-w-32">
                <span className="text-red-500">* </span>Имя:
              </p>
              <input
                type="text"
                className="input-primary dark:text-support px-4 w-full"
                defaultValue={data?.name}
                placeholder="Имя бренда"
                {...register("name")}
              />
            </div>
            <div className="flex flex-col md:flex-row md:justify-between gap-2 w-full">
              <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full md:w-[60%]">
                <p>Рекомендуемый размер изображения 400 x 400</p>
                {selectedImage ? (
                  <div className="relative block h-[250px] w-[250px]">
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
                  <div className="center-col relative h-[250px] w-[250px]">
                    <img
                      src={apiUrl + "/" + data.image}
                      alt="image of brand"
                      className="object-contain h-full w-full"
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
                <button className="btn-primary center-row justify-center gap-2 px-4 w-full">
                  <Save className="size-5" />
                  <span className="font-semibold">Сохранить</span>
                </button>
                <button
                  onClick={(event) => confirmDelete(event)}
                  className="btn-primary bg-red-500 center-row justify-center gap-2 px-4 w-full"
                >
                  <Trash2 className="size-5" />
                  <span className="font-semibold">Удалить</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
