"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import Image from "next/image";
import * as NProgress from "nprogress";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PlusIcon, ImagePlus, Edit3, Trash2, X } from "lucide-react";

const fetchProductStatuses = async () => {
  const response = await fetch(`${apiUrl}/statuses/fetch/all`);
  const data = await response.json();
  return data;
};

export default function ProductStatusesPage() {
  const [statuses, setStatuses] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchProductStatuses();
      setStatuses(response?.productStatuses?.sort((a, b) => a.id - b.id));
    };

    getData();
  }, []);

  const createNewStatus = async (data) => {
    if (!data.nameTm) {
      ErrorToast({
        errorText: "Дайте название статуса на туркменском языке.",
      });
      return;
    }

    if (!data.nameRu) {
      ErrorToast({
        errorText: "Дайте название статуса на русском языке.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(`${apiUrl}/statuses/new`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        SuccessToast({ successText: "Статус добавлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал новый статус : ${data.nameRu}`,
          "CREATE"
        );

        const updatedData = await fetchProductStatuses();
        setStatuses(updatedData?.productStatuses?.sort((a, b) => a.id - b.id));

        reset();
        setSelectedImage(null);
        setShowNewForm(false);
      } else {
        const responseData = await response.json();
        ErrorToast({ errorText: responseData.message });
      }
    } catch (err) {
      console.log(err);
      ErrorToast({ errorText: "Ошибка при создании статуса." });
    }
  };

  const updateStatus = async (data) => {
    if (!data.nameTm) {
      ErrorToast({
        errorText: "Дайте название статуса на туркменском языке.",
      });
      return;
    }

    if (!data.nameRu) {
      ErrorToast({
        errorText: "Дайте название статуса на русском языке.",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nameTm", data.nameTm);
      formData.append("nameRu", data.nameRu);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch(
        `${apiUrl}/statuses/update/${editingStatus.id}`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      if (response.ok) {
        SuccessToast({ successText: "Статус обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил статус : ${data.nameRu}`,
          "UPDATE"
        );

        // Refresh the list
        const updatedData = await fetchProductStatuses();
        setStatuses(updatedData?.productStatuses?.sort((a, b) => a.id - b.id));

        // Reset form
        reset();
        setSelectedImage(null);
        setEditingStatus(null);
      } else {
        const responseData = await response.json();
        ErrorToast({ errorText: responseData.message });
      }
    } catch (err) {
      console.log(err);
      ErrorToast({ errorText: "Ошибка при обновлении статуса." });
    }
  };

  const deleteStatus = async (id, nameRu) => {
    if (!confirm(`Вы уверены, что хотите удалить статус "${nameRu}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/statuses/delete/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        SuccessToast({ successText: "Статус удален." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Удалил статус : ${nameRu}`,
          "DELETE"
        );

        // Refresh the list
        const updatedData = await fetchProductStatuses();
        setStatuses(updatedData?.productStatuses?.sort((a, b) => a.id - b.id));
      } else {
        const responseData = await response.json();
        ErrorToast({ errorText: responseData.message });
      }
    } catch (err) {
      console.log(err);
      ErrorToast({ errorText: "Ошибка при удалении статуса." });
    }
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setValue("nameTm", status.nameTm);
    setValue("nameRu", status.nameRu);
    setSelectedImage(null);
  };

  const handleCancelEdit = () => {
    setEditingStatus(null);
    reset();
    setSelectedImage(null);
  };

  const handleCancelNew = () => {
    setShowNewForm(false);
    reset();
    setSelectedImage(null);
  };

  const getFile = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file || null);
  };

  const handleFormSubmit = (data) => {
    if (editingStatus) {
      updateStatus(data);
    } else {
      createNewStatus(data);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Статусы товаров</h2>
      </div>
      <div className="center-col gap-4">
        {/* Add New Status Button */}
        {!showNewForm && !editingStatus && (
          <button
            onClick={() => setShowNewForm(true)}
            className="btn-primary center-row justify-center gap-2 px-4 w-full max-w-2xl"
          >
            <PlusIcon className="size-5" />
            <span className="font-semibold text-sm md:text-base">
              Добавить новый статус
            </span>
          </button>
        )}

        {/* New/Edit Status Form */}
        {(showNewForm || editingStatus) && (
          <div className="w-full max-w-2xl">
            <div className="basic-border bg-white dark:bg-dark p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingStatus ? "Редактировать статус" : "Новый статус"}
                </h3>
                <button
                  onClick={editingStatus ? handleCancelEdit : handleCancelNew}
                  className="p-1 hover:bg-support dark:hover:bg-darkTwo rounded"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(handleFormSubmit)}
                className="form-holder"
              >
                <div className="center-row gap-1 w-full">
                  <p className="min-w-24 md:min-w-32">
                    <span className="text-red-500">* </span>Имя (ткм):
                  </p>
                  <input
                    type="text"
                    className="input-primary dark:text-support px-2 w-full"
                    placeholder="Имя статуса (ткм.)"
                    {...register("nameTm")}
                  />
                </div>

                <div className="center-row gap-1 w-full">
                  <p className="min-w-24 md:min-w-32">
                    <span className="text-red-500">* </span>Имя (ру):
                  </p>
                  <input
                    type="text"
                    className="input-primary dark:text-support px-2 w-full"
                    placeholder="Имя статуса (ру.)"
                    {...register("nameRu")}
                  />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-1 w-full">
                  <p className="min-w-24 md:min-w-32">Изображение:</p>
                  <div className="bg-support dark:bg-darkTwo basic-border flex flex-col items-center justify-between gap-2 p-2 w-full">
                    <p className="text-center">Изображение статуса 300 x 300</p>
                    {selectedImage ? (
                      <div className="center-col relative block h-32 w-32">
                        <Image
                          src={URL.createObjectURL(selectedImage)}
                          alt="status image"
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                          fill
                        />
                      </div>
                    ) : editingStatus?.image ? (
                      <div className="center-col relative block h-32 w-32">
                        <Image
                          src={`${apiUrl}/${editingStatus.image}`}
                          alt="current status image"
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw"
                          fill
                        />
                      </div>
                    ) : (
                      <div className="center-col h-32 w-32">
                        <ImagePlus className="text-dark dark:text-support size-12" />
                      </div>
                    )}
                    <input
                      type="file"
                      name="image"
                      onChange={getFile}
                      accept="image/*"
                      className="custom-file-input"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn-primary center-row justify-center gap-2 px-4 flex-1"
                  >
                    {editingStatus ? "Обновить" : "Добавить"}
                  </button>
                  <button
                    type="button"
                    onClick={editingStatus ? handleCancelEdit : handleCancelNew}
                    className="btn-secondary center-row justify-center gap-2 px-4 flex-1"
                  >
                    Отмена
                  </button>
                </div>

                <div className="border-0 md:border-t border-support-200 pt-2 mt-auto">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Рекомендуем выложить изображения не больше 1ого мегабайта.
                  </p>
                  <p className="text-red-500 text-sm">*(обязательные поля)</p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Statuses List */}
        <div className="basic-border flex flex-col px-2 pb-2 h-fit w-full max-w-2xl">
          <div className="border-b border-support-200 center-row justify-between h-9 w-full">
            <p className="font-bold w-1/4">Изображение</p>
            <p className="font-bold w-1/4">Имя (ру)</p>
            <p className="font-bold w-1/4">Имя (ткм)</p>
            <p className="font-bold w-1/4">Действия</p>
          </div>
          <div className="flex flex-col items-center justify-between h-full">
            {statuses?.map((item) => {
              return (
                <div
                  className="border-b border-support-200 center-row justify-between h-16 w-full"
                  key={item.id}
                >
                  <div className="w-1/4 flex justify-center">
                    {item.image ? (
                      <div className="relative h-12 w-12">
                        <Image
                          src={`${apiUrl}/${item.image}`}
                          alt={item.nameRu}
                          className="object-contain rounded"
                          sizes="48px"
                          fill
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 bg-support dark:bg-darkTwo rounded flex items-center justify-center">
                        <ImagePlus className="size-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="w-1/4 px-2">{item.nameRu}</p>
                  <p className="w-1/4 px-2">{item.nameTm}</p>
                  <div className="w-1/4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 hover:bg-support dark:hover:bg-darkTwo rounded"
                      title="Редактировать"
                    >
                      <Edit3 className="size-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => deleteStatus(item.id, item.nameRu)}
                      className="p-1 hover:bg-support dark:hover:bg-darkTwo rounded"
                      title="Удалить"
                    >
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
            {statuses?.length === 0 && (
              <div className="center-col h-32 w-full">
                <p className="text-gray-500">Статусы не найдены</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
