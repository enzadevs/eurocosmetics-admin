"use client";

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
} from "@headlessui/react";
import { ChevronDown, Star } from "lucide-react";

const fetchReviews = async (filters = {}) => {
  const response = await fetch(`${apiUrl}/actions/market/all`, {
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

export default function MarketReviewsPage() {
  const [marketReviews, setMarketReviews] = useState([]);
  const [activeStates, setActiveStates] = useState({});
  const [replyTexts, setReplyTexts] = useState({});
  const { handleSubmit } = useForm();
  const currentPageRef = useRef(1);
  const [totalPages, setTotalPages] = useState(1);
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchReviews();
      setMarketReviews(response?.reviews);
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
    setMarketReviews(response?.reviews);
    setTotalPages(response?.pagination?.totalPages || 1);
  };

  const updateMarketReview = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/actions/market/update/${id}`, {
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
          `Обновил отзыв маркета с ID : ${id}`,
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
    setMarketReviews(response?.reviews);
    setTotalPages(response?.pagination?.totalPages || 1);
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Отзывы магазина</h2>
      </div>
      <div className="flex flex-col items-center min-h-[70vh]">
        <div className="basic-border flex flex-col h-fit w-full max-w-2xl">
          <div className="bg-support dark:bg-darkTwo border-b border-grey center-row px-2 h-9">
            <h2 className="w-96">Клиент</h2>
            <h2 className="mr-4 w-20">Оценка</h2>
            <h2 className="mr-4">Дата</h2>
          </div>
          <div className="flex flex-col items-center justify-between h-full">
            {marketReviews?.map((review) => (
              <Disclosure
                key={review.id}
                as="div"
                className="bg-support dark:bg-darkTwo border-b border-grey flex flex-col px-2 h-fit w-full"
                defaultOpen={false}
              >
                <DisclosureButton className="group flex items-center h-9 w-full">
                  <p className="text-left w-96">{review.Customer.username}</p>
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
                  <p className="mr-4">{review.createdAt}</p>
                  <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
                </DisclosureButton>
                <DisclosurePanel>
                  <form
                    className="flex flex-col gap-2 w-full"
                    onSubmit={handleSubmit(() => updateMarketReview(review.id))}
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
    </div>
  );
}
