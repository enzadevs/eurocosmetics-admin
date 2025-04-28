"use client";

import clsx from "clsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl } from "@/components/utils/utils";
import { useRouter } from "next/navigation";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useState, useEffect } from "react";
import {
  ListCheck,
  BadgeCheck,
  BadgeX,
  UserRoundX,
  PrinterCheck,
  Images,
  Ellipsis,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Dialog, DialogPanel } from "@headlessui/react";

const glutenCategoryId = "6518dba0-f9c4-4264-9fa9-4f37c49ca328";

const fetchOrderData = async (id) => {
  const response = await fetch(`${apiUrl}/orders/fetch/${id}`);
  const data = await response.json();
  return data;
};

const fetchPreparedInfo = async (id) => {
  const response = await fetch(`${apiUrl}/orders/prepare`);
  const data = await response.json();
  return data;
};

const bgClasses = {
  1: "bg-yellow-100",
  2: "bg-blue-100",
  3: "bg-green-100",
  4: "bg-red-100",
};

const calculateProductTotal = (item) => {
  const currentSellPrice = parseFloat(item?.Product?.currentSellPrice);
  const quantity = parseFloat(item?.quantity);
  return currentSellPrice * quantity;
};

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(
    3,
    5
  )}-${phoneNumber.slice(5, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(
    9
  )}`;
};

const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const productPrice = parseFloat(item.Product?.currentSellPrice) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    return total + productPrice * quantity;
  }, 0);
};

export default function OrderPage({ params }) {
  const [data, setData] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [ordersData, setOrdersData] = useState();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    phoneNumber: "",
    comment: "",
    address: {
      street: "",
      house: "",
      entrance: "",
      roof: "",
      room: "",
    },
    orderItems: [],
    sum: 0,
  });

  const { admin } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchOrderData(Number(params.id));
      setData(response.order);
    };

    const getAllInfo = async () => {
      const expressResponse = await fetchPreparedInfo();
      setOrdersData(expressResponse.preparedOrder?.otherInfo);
    };

    fetchData();
    getAllInfo();

    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [params.id]);

  useEffect(() => {
    if (data) {
      const initialOrderItems = data.OrderItems.map((item) => ({
        barcode: item?.Product?.barcode,
        quantity: parseFloat(item?.quantity),
        productPrice: parseFloat(item?.Product?.currentSellPrice),
      }));

      const initialSum = calculateOrderTotal(data.OrderItems);

      setEditedData({
        phoneNumber: data.phoneNumber || "",
        comment: data.comment || "",
        address: {
          street: data.Address?.street || "",
          house: data.Address?.house || "",
          entrance: data.Address?.entrance || "",
          roof: data.Address?.roof || "",
          room: data.Address?.room || "",
        },
        orderItems: initialOrderItems,
        sum: initialSum,
      });
    }
  }, [data]);

  const handlePageRefresh = async () => {
    const response = await fetchOrderData(Number(params.id));
    setData(response.order);
  };

  const updateOrderStatus = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/orders/update/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatusId: id }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Статус заказа обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил статус заказа номер : ${params?.id}`,
          "UPDATE"
        );

        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const updateOrderStatusTwo = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/orders/update/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderStatusId: id }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Статус заказа обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил статус заказа номер : ${params?.id}`,
          "UPDATE"
        );
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const blockCustomer = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/customer/block/${data?.customerId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isBlocked: true }),
        }
      );

      if (response.ok) {
        SuccessToast({
          successText:
            "Клиент заблокирован, его заказы больше не будут приниматься.",
        });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Заблокировал клиента с номером телефона : ${data?.Customer?.phoneNumber}`,
          "UPDATE"
        );

        handlePageRefresh();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const blockUser = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/customer/userblock/${data?.unRegisteredCustomerId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIsBlocked: true }),
        }
      );

      if (response.ok) {
        SuccessToast({
          successText:
            "Пользователь заблокирован, его заказы больше не будут приниматься.",
        });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Заблокировал пользователя с ID : ${data?.unRegisteredCustomerId}`,
          "UPDATE"
        );
        handlePageRefresh();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  function confirmBlock() {
    if (data?.customerId) {
      if (
        window.confirm(
          "Вы действительно хотите заблокировать зарегистрированного клиента?"
        )
      ) {
        blockCustomer();
      }
    } else if (data?.unRegisteredCustomerId) {
      if (
        window.confirm(
          "Вы действительно хотите заблокировать незарегистрированного пользавателья?"
        )
      ) {
        blockUser();
      }
    } else {
      ErrorToast({
        errorText: "Не удалось определить пользователя для блокировки.",
      });
    }
  }

  const handleOrderCancel = async () => {
    try {
      const response = await fetch(`${apiUrl}/orders/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: Number(params.id),
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Заказ успешно отменен." });
        setTimeout(() => {
          router.back();
        }, 500);
      }
    } catch (error) {
      Alert.alert(t.error, t.networkError);
    }
  };

  function confirmOrderCancel() {
    if (window.confirm(`Вы уверены, что хотите отменить заказ?`)) {
      handleOrderCancel();
    }
  }

  const printCheck = () => {
    updateOrderStatusTwo(2);
    window.print();

    newAction(
      admin?.user?.Role,
      admin?.user?.username,
      `Напечатал чек на заказ номер : ${params?.id}`,
      "UPDATE"
    );
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedImage(null);
  };

  const groupedItems = data?.OrderItems.reduce((acc, item) => {
    const categoryName = item?.Product?.Category?.nameRu;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {});

  const handleInputChange = (field, value) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1];
      setEditedData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setEditedData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleOrderUpdate = async () => {
    try {
      const response = await fetch(`${apiUrl}/orders/update/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: editedData.phoneNumber,
          comment: editedData.comment,
          address: editedData.address,
          orderItems: editedData.orderItems,
          sum: editedData.sum,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Заказ успешно обновлен" });
        setIsEditing(false);

        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedOrderItems = prevData.OrderItems.filter((item) =>
            editedData.orderItems.find(
              (editedItem) => editedItem.barcode === item.Product.barcode
            )
          );

          const updatedSum = calculateOrderTotal(updatedOrderItems);

          return {
            ...prevData,
            OrderItems: updatedOrderItems,
            sum: updatedSum,
          };
        });

        handlePageRefresh();

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил данные заказа номер : ${params?.id}`,
          "UPDATE"
        );
      } else {
        const error = await response.json();
        ErrorToast({ errorText: error.message });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({ errorText: "Ошибка при обновлении заказа" });
    }
  };

  const renderOrderInfo = () => (
    <div className="flex flex-col h-fit w-full">
      <div
        className={`border-b-2 ${
          isEditing ? "border-primary" : "border-dark/50"
        } center-row items-center justify-between text-dark py-2 w-full`}
      >
        <span className="text-black font-medium text-sm md:text-base">
          Номер телефона:
        </span>
        {isEditing ? (
          <input
            type="text"
            value={editedData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            className="bg-white dark:bg-darkTwo rounded text-dark placeholder:text-grey outline-none text-sm md:text-base transition-all ring-1 ring-support-200 ring-inset focus:ring-2 focus:ring-primary h-9 px-2 py-1 w-1/2"
          />
        ) : (
          <span className="font-bold dark:text-support">
            {formatPhoneNumber(data?.phoneNumber)}
          </span>
        )}
      </div>
      {["street", "house", "entrance", "roof", "room"].map((field) => (
        <div
          key={field}
          className={`border-b-2 ${
            isEditing ? "border-primary" : "border-dark/50"
          } center-row items-center justify-between text-dark py-2 w-full`}
        >
          <span className="text-black font-medium text-sm md:text-base min-w-32">
            Адрес -{" "}
            {field === "street"
              ? "Улица"
              : field === "house"
              ? "Дом"
              : field === "entrance"
              ? "Подъезд"
              : field === "roof"
              ? "Этаж"
              : "Квартира"}
            :
          </span>
          {isEditing ? (
            <input
              type="text"
              value={editedData.address[field]}
              onChange={(e) =>
                handleInputChange(`address.${field}`, e.target.value)
              }
              className="bg-white dark:bg-darkTwo rounded text-dark placeholder:text-grey outline-none text-sm md:text-base transition-all ring-1 ring-support-200 ring-inset focus:ring-2 focus:ring-primary h-9 px-2 py-1 w-1/2"
            />
          ) : (
            <span className="dark:text-support font-bold text-end line-clamp-6 max-w-3xl">
              {data?.Address?.[field] || "Нет"}
            </span>
          )}
        </div>
      ))}
      <div
        className={`border-b-2 ${
          isEditing ? "border-primary" : "border-dark/50"
        } center-row items-center justify-between text-dark py-2 w-full`}
      >
        <span className="text-black font-medium text-sm md:text-base">
          Комментарий:
        </span>
        {isEditing ? (
          <textarea
            value={editedData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            className="bg-white dark:bg-darkTwo rounded text-dark placeholder:text-grey outline-none text-sm md:text-base transition-all ring-1 ring-support-200 ring-inset focus:ring-2 focus:ring-primary min-h-12 px-2 py-1 w-1/2"
          />
        ) : (
          <span className="dark:text-support font-bold line-clamp-6 text-right h-fit max-w-3xl">
            {data?.comment || "Нет"}
          </span>
        )}
      </div>
    </div>
  );

  const hasOnlyGlutenProducts = data?.OrderItems?.every(
    (item) => item.Product?.Category?.id === glutenCategoryId
  );

  return (
    <>
      <div className="hideout gap-2">
        <div className="center-row h-12">
          <BackForthButtons />
          <h2>Номер заказа: {params?.id}</h2>
        </div>
        <div className="center-row gap-1 md:gap-2 justify-between md:justify-start">
          <button
            onClick={() => {
              updateOrderStatus(1);
            }}
            className="btn-grey px-4"
          >
            <Ellipsis className="size-5" />
            <span className="hidden lg:block text-sm">Обрабатываем</span>
          </button>
          <button
            onClick={() => {
              updateOrderStatus(2);
            }}
            className="btn-blue px-4"
          >
            <ListCheck className="size-5" />
            <span className="hidden lg:block text-sm">Принят</span>
          </button>
          <button
            onClick={() => {
              updateOrderStatus(3);
            }}
            className="btn-success px-4"
          >
            <BadgeCheck className="size-5" />
            <span className="hidden lg:block text-sm">Оформлен</span>
          </button>
          {data?.orderStatusId === 4 ? (
            <></>
          ) : (
            <button
              onClick={() => {
                confirmOrderCancel();
              }}
              className="btn-danger px-4"
            >
              <BadgeX className="size-5" />
              <span className="hidden lg:block text-sm">Отменить</span>
            </button>
          )}
          <button
            onClick={() => {
              confirmBlock();
            }}
            className="btn-danger px-4"
          >
            <UserRoundX className="size-5" />
            <span className="hidden lg:block text-sm">Заблокировать</span>
          </button>
          <div className="center-row md:ml-auto w-fit">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-danger px-4"
                >
                  <X className="size-5" />
                  <span className="hidden lg:block text-sm">Отменить</span>
                </button>
                <button
                  onClick={handleOrderUpdate}
                  className="btn-success px-4"
                >
                  <Save className="size-5" />
                  <span className="hidden lg:block text-sm">Сохранить</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-primary center-row gap-1 px-4"
              >
                <Edit2 className="size-5" />
                <span className="hidden lg:block text-sm">Изменить</span>
              </button>
            )}
          </div>
          <button
            onClick={() => {
              printCheck();
            }}
            className="btn-success px-4"
          >
            <PrinterCheck className="size-5" />
            <span className="hidden lg:block text-sm">Напечатать чек</span>
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="bg-white dark:bg-dark basic-border flex flex-col gap-1 h-fit w-full lg:w-[60%]">
            <div className="max-h-[768px] w-full overflow-y-auto overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[768px] table-auto">
                <thead className="h-9 md:h-auto">
                  <tr className="border-b border-support-200 text-left">
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base w-14">
                      Картина
                    </th>
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base">
                      Баркод
                    </th>
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base">
                      Имя
                    </th>
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base">
                      Кол.
                    </th>
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base">
                      Цена
                    </th>
                    <th className="p-2 font-semibold text-grey-400 text-xs md:text-base">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedItems &&
                    Object.keys(groupedItems).map((categoryName) => (
                      <>
                        <tr key={`category-${categoryName}`}>
                          <td
                            colSpan="6"
                            className="text-left font-bold underline text-primary px-2"
                          >
                            {categoryName}
                          </td>
                        </tr>
                        {groupedItems[categoryName].map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-gray-200"
                          >
                            <td className="p-2 max-w-14">
                              <button
                                className="center-col relative h-10 w-10"
                                onClick={() =>
                                  openModal(item?.Product?.imageOne)
                                }
                              >
                                {item?.Product?.imageOne ? (
                                  <img
                                    src={`${apiUrl}/${item?.Product?.imageOne}`}
                                    alt="product"
                                    className="rounded object-contain h-9 min-w-9"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <Images className="text-dark size-5" />
                                )}
                              </button>
                            </td>
                            <td className="p-2">{item?.Product?.barcode}</td>
                            <td className="p-2">{item?.Product?.nameRu}</td>
                            <td className="p-2">
                              {parseFloat(item.quantity).toFixed(3)}
                            </td>
                            <td className="p-2">
                              {parseFloat(
                                item?.Product?.currentSellPrice
                              ).toFixed(2)}
                            </td>
                            <td className="p-2">
                              {(
                                parseFloat(item?.Product?.currentSellPrice) *
                                item?.quantity
                              ).toFixed(2)}{" "}
                            </td>
                          </tr>
                        ))}
                      </>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <div
            className={clsx(
              "basic-border flex flex-col px-2 h-fit w-full lg:w-[40%]",
              bgClasses[data?.OrderStatus?.id]
            )}
          >
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Номер заказа:
              </span>
              <span className="font-bold dark:text-support">{params?.id}</span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <p className="text-black font-medium text-sm md:text-base">
                Имя клиента:
              </p>
              <span className="font-bold dark:text-support">
                {data?.customerId
                  ? data?.Customer?.username
                  : data?.UnRegisteredCustomer?.username}
              </span>
            </div>
            {renderOrderInfo()}
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Баллы за заказ:
              </span>
              <span className="font-bold text-green-600 dark:text-support">
                {data?.pointsEarned}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Оплата баллами:
              </span>
              <span className="font-bold dark:text-support">
                {data?.payPoints}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Создано:
              </span>
              <span className="font-bold dark:text-support">
                {data?.createdAt}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Статус заказа:
              </span>
              <span className="font-bold">{data?.OrderStatus?.nameRu}</span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Оплата:
              </span>
              <span className="font-bold dark:text-support">
                {data?.PaymentType?.nameRu}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Язык курьера:
              </span>
              <span className="text-violet-500 font-bold">
                {data?.CourierLang?.nameRu || "Без разницы"}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Время доставки:
              </span>
              <span className="text-violet-500 font-bold">
                {data?.OrderTime
                  ? `${data?.OrderTime?.nameRu} / ${data?.OrderTime?.time}`
                  : data?.DeliveryType?.nameRu}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Способ доставки:
              </span>
              <span className="text-primary font-bold">
                {data?.DeliveryType?.nameRu}{" "}
                {data?.deliveryTypeId === 3 && (
                  <>{ordersData?.expressPrice} M</>
                )}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Место доставки:
              </span>
              <span className="text-primary font-bold">
                {/* Asgabat - Dine Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {parseFloat(data?.glutenDeliveryPrice).toFixed(2) + " M"}
                    </>
                  )}

                {/* Basgalar - Dine Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.OrderCity?.price + " M"}
                    </>
                  )}

                {/* Asgabat - Arzanal We Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} + ${
                            data?.glutenDeliveryPrice
                          }) = ${
                            data?.OrderCity?.price + data?.glutenDeliveryPrice
                          } M`
                        : `${data?.OrderCity?.price} M`}
                    </>
                  )}

                {/* Basgalar - Arzanal We Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) = ${
                            data?.OrderCity?.price * 2
                          } M`
                        : `${data?.OrderCity?.price} M`}
                    </>
                  )}

                {/* Baryp almak */}
                {data?.deliveryTypeId === 2 && "0 M"}

                {/* Express - Asgabat - Dine Gluten */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {`(${data?.glutenDeliveryPrice} × 2) = ${parseFloat(
                        data?.glutenDeliveryPrice * 2
                      ).toFixed(2)} M`}
                    </>
                  )}

                {/* Express - Basgalar - Dine Gluten */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {`(${data?.OrderCity?.price} × 2) = ${
                        data?.OrderCity?.price * 2
                      } M`}
                    </>
                  )}

                {/* Express - Asgabat - Gluten we Beylekiler */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) + (${
                            data?.glutenDeliveryPrice
                          } × 2) = ${
                            data?.OrderCity?.price * 2 +
                            data?.glutenDeliveryPrice * 2
                          } M`
                        : `${data?.OrderCity?.price * 2} M`}
                    </>
                  )}

                {/* Express - Basgalar - Gluten we Beylekiler */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) + (${
                            data?.OrderCity?.price
                          } × 2) = ${data?.OrderCity?.price * 4} M`
                        : `${data?.OrderCity?.price * 2} M`}
                    </>
                  )}
              </span>
            </div>
            <div className="border-b border-dark/50 center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Сумма товаров:
              </span>
              <span className="text-primary font-bold">
                {parseFloat(data?.sum - data?.payPoints).toFixed(2)} M
              </span>
            </div>
            <div className="center-row justify-between text-dark h-8 w-full">
              <span className="text-black font-medium text-sm md:text-base">
                Сумма заказа:
              </span>
              <span className="text-primary font-bold">
                <>
                  {/* Asgabat - Dine Gluten */}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                        data?.glutenDeliveryPrice || 0
                    ).toFixed(2)}

                  {/* Beylekiler - Dine Gluten */}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price || 0)
                    ).toFixed(2)}

                  {/* Asgabat - Gluten we Beylekiler*/}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price +
                        (data?.glutenDeliveryPrice || 0) || 0)
                    ).toFixed(2)}

                  {/* Basgalar - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price +
                        (data?.glutenDeliveryPrice > 0
                          ? data?.OrderCity?.price
                          : 0))
                    ).toFixed(2)}

                  {/* Baryp almak */}
                  {data?.deliveryTypeId === 2 &&
                    parseFloat(data?.sum - data?.payPoints).toFixed(2)}

                  {/* Express Asgabat - Dine Gluten */}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts && (
                      <>
                        {parseFloat(
                          data?.sum -
                            data?.payPoints +
                            (data?.glutenDeliveryPrice || 0) * 2
                        ).toFixed(2)}
                      </>
                    )}

                  {/* Express Basgalar - Dine Gluten */}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      data?.OrderCity?.price * 2
                    ).toFixed(2)}

                  {/* Express Ashgabat - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price * 2 +
                        (data?.glutenDeliveryPrice > 0
                          ? (data?.glutenDeliveryPrice || 0) * 2
                          : 0))
                    ).toFixed(2)}

                  {/* Express Basgalar - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price * 2 +
                        (data?.glutenDeliveryPrice > 0
                          ? data?.OrderCity?.price * 2
                          : 0))
                    ).toFixed(2)}
                </>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="unhideout">
        <div className="flex flex-col p-2 w-1/2">
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">
              Номер заказа:
            </p>
            <p className="font-bold font-sans">{data?.id}</p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">Дата:</p>
            <p className="font-bold font-sans">{data?.createdAt}</p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">
              Имя клиента:
            </p>
            <p className="font-bold font-sans">
              {data?.customerId
                ? data?.Customer?.username
                : data?.UnRegisteredCustomer?.username}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold font-sans">Номер телефона:</p>
            <p className="font-bold text-lg font-sans">{data?.phoneNumber}</p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold font-sans">Место доставки:</p>
            <p className="font-bold text-lg font-sans">
              {data?.OrderCity ? <>{data?.OrderCity?.nameRu}</> : <>Нет</>}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold">Адрес - улица:</p>
            <p className="font-bold text-lg text-right line-clamp-6">
              {data?.Address?.street || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold">Адрес - дом:</p>
            <p className="font-bold text-lg text-right line-clamp-6">
              {data?.Address?.house || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold line-clamp-6">
              Адрес - подъезд:
            </p>
            <p className="font-bold text-lg text-right">
              {data?.Address?.entrance || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold line-clamp-6">Адрес - этаж:</p>
            <p className="font-bold text-lg text-right">
              {data?.Address?.roof || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-black font-bold line-clamp-6">
              Адрес - квартира:
            </p>
            <p className="font-bold text-lg text-right">
              {data?.Address?.room || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">
              Язык курьера:
            </p>
            <p className="font-bold font-sans">
              {data?.CourierLang?.nameRu || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">Оплата:</p>
            <p className="font-bold font-sans">
              {data?.PaymentType?.nameRu || "Нет"}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">
              Время доставки:
            </p>
            <p className="font-bold font-sans">
              {data?.OrderTime ? (
                <>
                  {data?.OrderTime?.nameRu +
                    " / " +
                    "(" +
                    data?.OrderTime.time +
                    ")"}
                </>
              ) : (
                <>Нет</>
              )}
            </p>
          </div>
          <div className="border-b border-black center-row justify-between w-full">
            <p className="text-sm text-black font-bold font-sans">Заметки:</p>
            <p className="font-bold text-right font-sans">
              {data?.comment ? data?.comment : "Нет"}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto mt-2">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-100 h-6">
                <th className="border border-black font-bold text-center font-sans">
                  Наименование
                </th>
                <th className="border border-black font-bold text-center font-sans">
                  Баркод
                </th>
                <th className="border border-black font-bold text-center font-sans">
                  Кол.
                </th>
                <th className="border border-black font-bold text-center font-sans">
                  Цена
                </th>
                <th className="border border-black font-bold text-center font-sans">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.OrderItems?.map((item) => (
                <tr key={item.id} className="border-b border-black h-6">
                  <td className="text-xs border-r border-black w-52 break-words text-black font-medium font-sans">
                    {item.Product?.nameRu}
                  </td>
                  <td className="text-xs border-r border-black text-center text-black font-medium font-sans">
                    {item.Product?.barcode}
                  </td>
                  <td className="text-xs border-r border-black text-center italic text-black font-medium font-sans">
                    {item.Product?.unit === "Piece" ? (
                      <>{Number(item.quantity)}</>
                    ) : (
                      <>
                        {Number.isInteger(parseFloat(item.quantity))
                          ? Number(item.quantity)
                          : parseFloat(item.quantity).toFixed(2)}
                      </>
                    )}
                    {item.Product?.unit === "Piece" ? " шт." : " кг."}
                  </td>
                  <td className="text-xs border-r border-black text-center text-black font-medium font-sans">
                    {Number.parseFloat(
                      item.Product?.currentSellPrice?.toString()
                    ).toFixed(2)}
                  </td>
                  <td className="text-xs border-r border-black text-center text-black font-medium font-sans">
                    {calculateProductTotal(item).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto w-full">
            <div className="border-b border-black center-row justify-between ml-auto w-full">
              <p className="text-black font-medium font-sans">Сумма товаров:</p>
              <p className="font-bold text-lg font-sans">
                {data?.payPoints > 0 ? (
                  <>
                    ({parseFloat(data?.sum).toFixed(2)}) - (
                    {parseFloat(data?.payPoints).toFixed(2)}) ={" "}
                    {parseFloat(data?.sum - data?.payPoints).toFixed(2)}
                  </>
                ) : (
                  <>{parseFloat(data?.sum).toFixed(2)}</>
                )}
              </p>
            </div>
            <div className="border-b border-black center-row justify-between ml-auto w-full">
              <p className="text-black font-medium font-sans">
                Стоимость доставки:
              </p>
              <p className="font-bold text-lg font-sans">
                {/* Asgabat - Dine Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {parseFloat(data?.glutenDeliveryPrice).toFixed(2) + " M"}
                    </>
                  )}

                {/* Basgalar - Dine Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.OrderCity?.price + " M"}
                    </>
                  )}

                {/* Asgabat - Arzanal We Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} + ${
                            data?.glutenDeliveryPrice
                          }) = ${
                            data?.OrderCity?.price + data?.glutenDeliveryPrice
                          } M`
                        : `${data?.OrderCity?.price} M`}
                    </>
                  )}

                {/* Basgalar - Arzanal We Gluten */}
                {data?.deliveryTypeId === 1 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) = ${
                            data?.OrderCity?.price * 2
                          } M`
                        : `${data?.OrderCity?.price} M`}
                    </>
                  )}

                {/* Baryp almak */}
                {data?.deliveryTypeId === 2 && "0 M"}

                {/* Express - Asgabat - Dine Gluten */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {`(${data?.glutenDeliveryPrice} × 2) = ${parseFloat(
                        data?.glutenDeliveryPrice * 2
                      ).toFixed(2)} M`}
                    </>
                  )}

                {/* Express - Basgalar - Dine Gluten */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {`(${data?.OrderCity?.price} × 2) = ${
                        data?.OrderCity?.price * 2
                      } M`}
                    </>
                  )}

                {/* Express - Asgabat - Gluten we Beylekiler */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId === 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) + (${
                            data?.glutenDeliveryPrice
                          } × 2) = ${
                            data?.OrderCity?.price * 2 +
                            data?.glutenDeliveryPrice * 2
                          } M`
                        : `${data?.OrderCity?.price * 2} M`}
                    </>
                  )}

                {/* Express - Basgalar - Gluten we Beylekiler */}
                {data?.deliveryTypeId === 3 &&
                  data?.orderCityId !== 1 &&
                  hasOnlyGlutenProducts === false && (
                    <>
                      {data?.OrderCity?.nameRu} /{" "}
                      {data?.glutenDeliveryPrice > 0
                        ? `(${data?.OrderCity?.price} × 2) + (${
                            data?.OrderCity?.price
                          } × 2) = ${data?.OrderCity?.price * 4} M`
                        : `${data?.OrderCity?.price * 2} M`}
                    </>
                  )}
              </p>
            </div>
            <div className="border-b border-black center-row justify-between ml-auto w-full">
              <p className="text-black font-bold font-sans">Итого к оплате:</p>
              <p className="font-bold text-lg font-sans">
                <>
                  {/* Asgabat - Dine Gluten */}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                        data?.glutenDeliveryPrice || 0
                    ).toFixed(2)}

                  {/* Beylekiler - Dine Gluten */}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price || 0)
                    ).toFixed(2)}

                  {/* Asgabat - Gluten we Beylekiler*/}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price +
                        (data?.glutenDeliveryPrice || 0) || 0)
                    ).toFixed(2)}

                  {/* Basgalar - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 1 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price +
                        (data?.glutenDeliveryPrice > 0
                          ? data?.OrderCity?.price
                          : 0))
                    ).toFixed(2)}

                  {/* Baryp almak */}
                  {data?.deliveryTypeId === 2 &&
                    parseFloat(data?.sum - data?.payPoints).toFixed(2)}

                  {/* Express Asgabat - Dine Gluten */}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts && (
                      <>
                        {parseFloat(
                          data?.sum -
                            data?.payPoints +
                            (data?.glutenDeliveryPrice || 0) * 2
                        ).toFixed(2)}
                      </>
                    )}

                  {/* Express Basgalar - Dine Gluten */}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      data?.OrderCity?.price * 2
                    ).toFixed(2)}

                  {/* Express Ashgabat - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId === 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price * 2 +
                        (data?.glutenDeliveryPrice > 0
                          ? (data?.glutenDeliveryPrice || 0) * 2
                          : 0))
                    ).toFixed(2)}

                  {/* Express Basgalar - Gluten we beylekiler*/}
                  {data?.deliveryTypeId === 3 &&
                    data?.orderCityId !== 1 &&
                    hasOnlyGlutenProducts === false &&
                    (
                      parseFloat(data?.sum - data?.payPoints) +
                      (data?.OrderCity?.price * 2 +
                        (data?.glutenDeliveryPrice > 0
                          ? data?.OrderCity?.price * 2
                          : 0))
                    ).toFixed(2)}
                </>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Dialog
        as="div"
        open={isOpen}
        transition
        onClose={closeModal}
        className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 dark:bg-grey/30 transition duration-100 ease-out data-[closed]:opacity-0"
      >
        <div className="fixed flex items-center justify-center">
          <DialogPanel as="div" className="bg-white rounded p-4 relative">
            <img
              src={`${apiUrl}/${selectedImage}`}
              alt=" "
              className="object-contain max-h-48 md:max-h-[400px] max-w-48 md:max-w-[400px]"
              crossOrigin="anonymous"
            />
            <button
              className="bg-primary rounded center-col absolute top-4 right-4 p-2 size-8 md:size-10"
              onClick={closeModal}
            >
              <p className="text-white font-bold">X</p>
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
