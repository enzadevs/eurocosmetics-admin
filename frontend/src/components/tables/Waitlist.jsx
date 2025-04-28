"use client";

import CategorySelectorState from "../product/CategorySelectorState";
import SubCategorySelectorState from "../product/SubCatSelectorState";
import SegmentSelectorState from "../product/SegmentSelectorState";
import BrandSelectorState from "../product/BrandSelectorState";
import StatusSelectorState from "../product/StatusSelectorState";
import ProductsPagination from "../nav/ProductsPagination";
import { newAction } from "../utils/ActionLogs";
import * as NProgress from "nprogress";
import { useAdminStore } from "../utils/useAdminStore";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl, SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Search, ArrowUp, ArrowDown, Images, Save, Edit } from "lucide-react";

const fetchProducts = async (filters) => {
  const response = await fetch(`${apiUrl}/actions/waitlist/all`, {
    method: "POST",
    body: JSON.stringify({
      query: filters?.query,
      page: filters.page || 1,
      limit: 20,
      brandId: filters?.brandId ? filters.brandId : null,
      categoryId: filters?.categoryId ? filters.categoryId : null,
      subCategoryId: filters?.subCategoryId ? filters.subCategoryId : null,
      segmentId: filters?.segmentId ? filters.segmentId : null,
      productStatusId: filters?.productStatusId
        ? filters.productStatusId
        : null,
      minPrice: filters?.minPrice || null,
      maxPrice: filters?.maxPrice || null,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data;
};

export default function WaitlistProductsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingStock, setEditingStock] = useState({});
  const [localFilters, setLocalFilters] = useState({
    query: searchParams.get("query") || "",
    page: parseFloat(searchParams.get("page") || "1", 10),
    brandId: searchParams.get("brandId") || null,
    categoryId: searchParams.get("categoryId") || null,
    subCategoryId: searchParams.get("subCategoryId") || null,
    segmentId: searchParams.get("segmentId") || null,
    productStatusId: searchParams.get("productStatusId") || null,
    minPrice: searchParams.get("minPrice") || null,
    maxPrice: searchParams.get("maxPrice") || null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { admin } = useAdminStore();

  const sortBy = searchParams.get("sortBy") || null;
  const sortOrder = searchParams.get("sortOrder") || null;

  const [data, setData] = useState({ products: [], pagination: {} });

  const updateSearchParams = useCallback(
    (newParams) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleLocalFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = useCallback(() => {
    updateSearchParams({ ...localFilters, page: "1" });
  }, [updateSearchParams, localFilters]);

  const handlePageChange = useCallback(
    (newPage) => {
      setLocalFilters((prev) => ({ ...prev, page: newPage }));
      updateSearchParams({ ...localFilters, page: newPage.toString() });
    },
    [updateSearchParams, localFilters]
  );

  const toggleSortByField = useCallback(
    (field) => {
      const newSortOrder =
        field === sortBy && sortOrder === "asc" ? "desc" : "asc";
      updateSearchParams({ sortBy: field, sortOrder: newSortOrder });
    },
    [sortBy, sortOrder, updateSearchParams]
  );

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchProducts(localFilters);
      setData(response);
    };
    fetchData();
  }, [searchParams]);

  const handleStockChange = (barcode, value) => {
    setEditingStock((prev) => ({
      ...prev,
      [barcode]: value,
    }));
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedImage(null);
  };

  const updateProductRequest = async (product, stock) => {
    try {
      const response = await fetch(
        `${apiUrl}/products/stock/${product.barcode}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ stock: stock }),
        }
      );

      if (response.ok) {
        SuccessToast({ successText: "Товар обновлен." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил сток товара с баркодом : ${product.barcode}`,
          "UPDATE"
        );
        const response = await fetchProducts(localFilters);
        setData(response);
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const saveStock = async (product) => {
    const newStock = editingStock[product.barcode];
    if (newStock !== undefined && newStock !== "") {
      await updateProductRequest(product, newStock);
      setEditingStock((prev) => {
        const updated = { ...prev };
        delete updated[product.barcode];
        return updated;
      });
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortBy) return data?.products;
    return [...data?.products].sort((a, b) => {
      const valueA = isNaN(a[sortBy]) ? a[sortBy] : Number(a[sortBy]);
      const valueB = isNaN(b[sortBy]) ? b[sortBy] : Number(b[sortBy]);
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      if (sortOrder === "asc") {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [data?.products, sortBy, sortOrder]);

  const sortIcon = useCallback(
    (field) =>
      sortBy === field ? (
        sortOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowDown className="h-4 w-4" />
      ),
    [sortBy, sortOrder]
  );

  const renderArrows = useCallback(
    (field) => (
      <span className="inline-flex float-right text-dark dark:text-support">
        {sortIcon(field)}
      </span>
    ),
    [sortIcon]
  );

  return (
    <div className="flex flex-col gap-4 min-h-[85vh]">
      <div className="border-b border-support-200 flex flex-col gap-2 pb-2">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex items-center justify-between gap-2 h-fit w-full">
            <input
              type="number"
              className="input-primary dark:text-support pl-4 w-40"
              placeholder="Мин. цена"
              value={localFilters.minPrice || ""}
              onChange={(e) =>
                handleLocalFilterChange("minPrice", e.target.value)
              }
            />
            <input
              type="number"
              className="input-primary dark:text-support pl-4 w-40"
              placeholder="Макс. цена"
              value={localFilters.maxPrice || ""}
              onChange={(e) =>
                handleLocalFilterChange("maxPrice", e.target.value)
              }
            />
          </div>
          <div className="center-row gap-1 w-full">
            <p className="min-w-32">Категория:</p>
            <CategorySelectorState
              value={localFilters.categoryId}
              onChange={(value) => handleLocalFilterChange("categoryId", value)}
            />
          </div>
          <div className="center-row gap-1 w-full">
            <p className="min-w-32">Подкатегория:</p>
            <SubCategorySelectorState
              value={localFilters.subCategoryId}
              onChange={(value) =>
                handleLocalFilterChange("subCategoryId", value)
              }
            />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="center-row gap-1 w-full">
            <p className="min-w-32">Сегмент:</p>
            <SegmentSelectorState
              value={localFilters.segmentId}
              onChange={(value) => handleLocalFilterChange("segmentId", value)}
            />
          </div>
          <div className="center-row gap-1 w-full">
            <p className="min-w-32">Статус:</p>
            <StatusSelectorState
              value={localFilters.productStatusId}
              onChange={(value) =>
                handleLocalFilterChange("productStatusId", value)
              }
            />
          </div>
          <div className="center-row gap-2 w-full">
            <div className="center-row gap-1 w-full">
              <p className="min-w-32">Бренд:</p>
              <BrandSelectorState
                value={localFilters.brandId}
                onChange={(value) => handleLocalFilterChange("brandId", value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="bg-support dark:bg-darkTwo border border-support-200 shadow shadow-support-200 rounded p-2 pb-4">
        <div className="relative center-row gap-2 w-full">
          <input
            className="input-primary dark:text-support pl-4 pr-14"
            type="text"
            placeholder="Поиск...(по имени и баркоду)"
            value={localFilters.query}
            onChange={(e) => handleLocalFilterChange("query", e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            className="btn-primary center-row gap-2 px-2 w-fit"
          >
            <Search className="size-5" />
            <span>Поиск</span>
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="table-fixed min-w-[1280px] w-full">
            <thead>
              <tr className="border-b border-support-200">
                <th className="w-10"></th>
                <th
                  className="w-40"
                  onClick={() => toggleSortByField("barcode")}
                >
                  Бар код
                  {renderArrows("barcode")}
                </th>
                <th className="w-80">Имя</th>
                <th
                  className="w-28"
                  onClick={() => toggleSortByField("currentSellPrice")}
                >
                  Цена
                  {renderArrows("currentSellPrice")}
                </th>
                <th className="w-24 text-center">Склад</th>
                <th className="w-20">Ед. изм.</th>
                <th className="w-32">Бренд</th>
                <th className="w-56">Категория</th>
                <th
                  className="w-20"
                  onClick={() => toggleSortByField("waitListCount")}
                >
                  Ожидают
                  {renderArrows("waitListCount")}
                </th>
                <th className="w-16 text-center">Изменить</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows?.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-support-200 cursor-pointer transition hover:bg-white dark:hover:bg-dark"
                >
                  <td
                    className="bg-white dark:bg-dark rounded center-col p-1 h-10 w-10"
                    onClick={() => openModal(row.imageOne)}
                  >
                    {row.imageOne === null || row.imageOne === undefined ? (
                      <Images className="text-dark dark:text-support size-5" />
                    ) : (
                      <img
                        src={`${apiUrl}/${row.imageOne}`}
                        width={112}
                        height={112}
                        alt="image of product"
                        className="object-contain h-full w-auto"
                        crossOrigin="anonymous"
                      />
                    )}
                  </td>
                  <td className="text-left max-w-40">{row.barcode}</td>
                  <td className="max-w-80">{row.nameRu}</td>
                  <td className="max-w-28">
                    {parseFloat(row.currentSellPrice).toFixed(2)} m
                  </td>
                  <td className="min-w-20 flex items-center justify-around">
                    <input
                      type="number"
                      value={
                        editingStock[row.barcode] ??
                        parseFloat(row.stock).toFixed(1)
                      }
                      onChange={(e) =>
                        handleStockChange(row.barcode, e.target.value)
                      }
                      className={`dark:bg-darkTwo text-center outline-none border-2 rounded ${
                        row?.stock === 0 || row?.stock === "0"
                          ? "border-red-500"
                          : "border-grey-200"
                      } focus:border-primary h-9 md:h-10 w-14`}
                    />
                    <button
                      onClick={() => saveStock(row)}
                      className="btn-primary center-col w-9 md:w-10"
                    >
                      <Save className="size-5" />
                    </button>
                  </td>
                  <td className="max-w-20">{row.unit}</td>
                  <td className="overflow-hidden max-w-32">
                    {row.Brand?.name}
                  </td>
                  <td className="overflow-hidden max-w-56">
                    {row.Category?.nameRu}
                  </td>
                  <td className="max-w-24 text-xs">{row.waitListCount}</td>
                  <td className="max-w-16 center-col">
                    <button
                      className="btn-primary center-col h-8 min-w-10"
                      onClick={() => {
                        router.push(`/home/products/${row?.barcode}`);
                        NProgress.start();
                      }}
                    >
                      <Edit className="size-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sortedRows?.length && (
            <div className="bg-blue-200 dark:bg-dark rounded center-col my-2 p-2 h-20">
              <p>Ничего не нашлось.</p>
            </div>
          )}
        </div>
      </div>
      <ProductsPagination
        currentPage={localFilters.page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={handlePageChange}
      />
      <Dialog
        as="div"
        open={isOpen}
        transition
        onClose={closeModal}
        className="fixed inset-0 flex w-screen items-center justify-center bg-black/30 dark:bg-grey/50 transition duration-100 ease-out data-[closed]:opacity-0"
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
