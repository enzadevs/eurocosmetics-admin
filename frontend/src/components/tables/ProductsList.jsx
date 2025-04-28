"use client";

import ProductsPagination from "../nav/ProductsPagination";
import { useAdminStore } from "../utils/useAdminStore";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl } from "@/components/utils/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  Search,
  ArrowUp,
  ArrowDown,
  Images,
  PlusCircle,
  XCircle,
} from "lucide-react";

const fetchProducts = async (filters) => {
  const response = await fetch(`${apiUrl}/products/all`, {
    method: "POST",
    body: JSON.stringify({
      query: filters?.query,
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

export default function ProductsList({ productsArray = [], onProductToggle }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingStock, setEditingStock] = useState({});
  const [localFilters, setLocalFilters] = useState({
    query: searchParams.get("query") || "",
    page: parseFloat(searchParams.get("page") || "1", 10),
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

  const isProductSelected = useCallback(
    (barcode) => {
      if (!productsArray || productsArray.length === 0) return false;
      return productsArray.includes(barcode);
    },
    [productsArray]
  );

  const sortedRows = useMemo(() => {
    if (!sortBy) return data?.products;
    return [...(data?.products || [])].sort((a, b) => {
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

  const handleToggleProduct = (barcode) => {
    if (onProductToggle) {
      onProductToggle(barcode);
    }
  };

  return (
    <div className="flex flex-col gap-4 min-h-[85vh]">
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
          <table className="table-fixed min-w-[768px] w-full">
            <thead>
              <tr className="border-b border-support-200">
                <th className="w-10"></th>
                <th
                  className="w-32"
                  onClick={() => toggleSortByField("barcode")}
                >
                  Бар код
                  {renderArrows("barcode")}
                </th>
                <th className="w-80">Имя</th>
                <th className="w-20">Действия</th>
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
                  <td className="w-20 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleProduct(row.barcode);
                      }}
                      className="p-1 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {isProductSelected(row.barcode) ? (
                        <XCircle className="h-6 w-6 text-red-500" />
                      ) : (
                        <PlusCircle className="h-6 w-6 text-green-500" />
                      )}
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
      <div className="mb-4"></div>
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
