"use client";

import Link from "next/link";
import Pagination from "@/components/nav/Pagination";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl, SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Switch,
  Dialog,
  DialogPanel,
} from "@headlessui/react";
import { ChevronDown, Star } from "lucide-react";

const fetchReviews = async (filters = {}) => {
  const response = await fetch(`${apiUrl}/actions/product/all`, {
    method: "POST",
    body: JSON.stringify({
      query: filters?.query || "",
      page: filters.page || 1,
      limit: 20,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function ProductsReviewsPage() {
  const [productReviews, setProductReviews] = useState([]);
  const [activeStates, setActiveStates] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const currentPageRef = useRef(1);
  const { handleSubmit } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchReviews();
      setProductReviews(response?.reviews);
      setTotalPages(response?.pagination?.totalPages || 1);

      const initialStates = {};
      const initialReplyTexts = {};
      response?.reviews.forEach((item) => {
        initialStates[item.id] = item.isActive;
        initialReplyTexts[item.id] = item.reply || "";
      });
      setActiveStates(initialStates);
      setReplyTexts(initialReplyTexts);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchReviews({ page: currentPageRef.current });
    setProductReviews(response?.reviews);
    setTotalPages(response?.pagination?.totalPages || 1);
  };

  const updateProductReview = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/actions/product/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reply: replyTexts[id],
          isActive: activeStates[id],
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Отзыв обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил отзыв на товар с ID : ${id}`,
          "UPDATE"
        );

        handlePageRefresh();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка при обновлении отзыва.",
        });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({
        errorText: "Произошла ошибка при обновлении отзыва.",
      });
    }
  };

  const toggleIsActive = (id) => {
    setActiveStates((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleReplyChange = (id, value) => {
    setReplyTexts((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handlePageChange = async (newPage) => {
    currentPageRef.current = newPage;
    const response = await fetchReviews({ page: newPage });
    setProductReviews(response?.reviews);
    setTotalPages(response?.pagination?.totalPages || 1);
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Отзывы товаров</h2>
      </div>
      <div className="flex flex-col items-center min-h-[70vh]">
        <div className="basic-border flex flex-col h-fit w-full max-w-3xl">
          <div className="bg-support dark:bg-darkTwo border-b border-grey center-row px-1 h-9">
            <h2 className="w-40">Клиент</h2>
            <h2 className="mr-4 w-72">Товар</h2>
            <h2 className="mr-4 w-20">Оценка</h2>
            <h2 className="mr-4 w-40">Дата</h2>
          </div>
          <div className="flex flex-col items-center justify-between h-full w-full">
            {productReviews?.map((review) => (
              <Disclosure
                key={review.id}
                as="div"
                className="bg-support dark:bg-darkTwo border-b border-grey flex flex-col gap-2 px-1 h-fit w-full"
                defaultOpen={false}
              >
                <DisclosureButton className="group flex items-center min-h-12 w-full">
                  <p className="text-left line-clamp-1 w-40">
                    {review.Customer.username || "Без имени"}
                  </p>
                  <div className="center-row mr-4 h-full w-72">
                    <button
                      onClick={() => openModal(review?.Product?.imageOne)}
                      className="bg-white rounded min-w-12"
                    >
                      <img
                        src={`${apiUrl}/${review?.Product?.imageOne}`}
                        alt="image of product"
                        className="object-contain h-12 w-12"
                        crossOrigin="anonymous"
                      />
                    </button>
                    <Link
                      href={`/home/products/${review?.Product?.barcode}`}
                      className="text-primary text-left line-clamp-2 underline pl-2"
                    >
                      {review?.Product?.nameRu}
                    </Link>
                  </div>
                  <div className="center-row mr-4 h-9 w-20">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-grey-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-left mr-4 w-40">{review.createdAt}</p>
                  <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
                </DisclosureButton>
                <DisclosurePanel>
                  <form
                    className="flex flex-col gap-2 w-full"
                    onSubmit={handleSubmit(() =>
                      updateProductReview(review.id)
                    )}
                  >
                    <div className="bg-white dark:bg-dark basic-border flex flex-col gap-2 p-2 w-full">
                      <p>{review.comment}</p>
                      <textarea
                        className="bg-support dark:bg-darkTwo border border-grey-200 rounded dark:text-support text-sm md:text-base outline-none focus:border-primary p-2 w-full"
                        value={replyTexts[review.id]}
                        onChange={(e) =>
                          handleReplyChange(review.id, e.target.value)
                        }
                        placeholder="Ответить на отзыв..."
                      />
                      <div className="flex items-center justify-between">
                        <p>Отзыв активен:</p>
                        <Switch
                          checked={activeStates[review.id]}
                          onChange={() => toggleIsActive(review.id)}
                          className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                          />
                        </Switch>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary mb-2">
                      <span className="font-semibold">Сохранить</span>
                    </button>
                  </form>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </div>
        </div>
      </div>
      <Pagination
        currentPage={currentPageRef.current}
        onPageChange={handlePageChange}
        totalPages={totalPages}
      />
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
    </div>
  );
}
