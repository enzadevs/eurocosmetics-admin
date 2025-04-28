import { apiUrl } from "../utils/utils";
import { useState, useEffect } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";

const fetchCategories = async () => {
  const response = await fetch(`${apiUrl}/categories/fetch/all`);
  const data = await response.json();
  return data.categories;
};

export default function CategorySelectorP({
  categoryIdRef,
  subCategoryIdRef,
  data,
}) {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedCategory, setComboboxSelectedCategory] =
    useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState();

  const [subCategories, setSubCategories] = useState([]);
  const [subCatQuery, setSubCatQuery] = useState("");
  const [comboboxSelectedSubCategory, setComboboxSelectedSubCategory] =
    useState(subCategories);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(
    subCategoryIdRef.current
  );

  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchCategories();
      setCategories(fetchedData);
      setComboboxSelectedCategory(null);

      if (data) {
        setComboboxSelectedCategory(data?.Category);
        setComboboxSelectedSubCategory(data?.SubCategory);
        categoryIdRef.current = data?.Category?.id;
        subCategoryIdRef.current = data?.SubCategory?.id;
      } else {
        setComboboxSelectedCategory(null);
        setComboboxSelectedSubCategory(null);
      }
    };

    getData();
  }, [data, categoryIdRef, subCategoryIdRef]);

  const handleCategorySelection = async (value) => {
    setComboboxSelectedCategory(value);
    setSelectedCategoryId(value?.id ? value?.id : null);
    categoryIdRef.current = value?.id || null;
    setComboboxSelectedSubCategory(null);

    if (value) {
      try {
        const response = await fetch(
          `${apiUrl}/categories/fetch/single/${value?.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setSubCategories(data.SubCategories);
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleSubCategorySelection = async (value) => {
    setComboboxSelectedSubCategory(value);
    setSelectedSubCategoryId(value?.id || null);
    subCategoryIdRef.current = value?.id || null;
  };

  const filteredCategories =
    query === ""
      ? categories
      : categories.filter((category) => {
          return category.nameRu.toLowerCase().includes(query.toLowerCase());
        });

  const filteredSubCategories =
    subCatQuery === ""
      ? subCategories
      : subCategories.filter((subCategory) => {
          return subCategory.nameRu
            .toLowerCase()
            .includes(subCatQuery.toLowerCase());
        });

  return (
    <div className="flex flex-col md:flex-row items-center gap-2 w-full">
      {/* <Combobox
        value={comboboxSelectedItem}
        onChange={handleSelectChange}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full">
          <ComboboxInput
            className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(category) => category?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Категория"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredCategories.map((category) => (
            <ComboboxOption
              key={category.id}
              value={category}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{category.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox> */}
      <div className="center-row gap-1 w-full">
        <p className="min-w-32">
          <span className="text-red-500">* </span>Категория
        </p>
        <Combobox
          value={comboboxSelectedCategory}
          onChange={handleCategorySelection}
          onClose={() => setQuery("")}
        >
          <div className="relative w-full">
            <ComboboxInput
              className="basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
              displayValue={(category) => category?.nameRu}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Категория"
            />
            <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
              <ChevronDown className="ml-auto mr-2 size-6" />
            </ComboboxButton>
          </div>
          <ComboboxOptions anchor="bottom" transition className="combo">
            {filteredCategories?.map((category) => (
              <ComboboxOption
                key={category?.id}
                value={category}
                className="group combo-option"
              >
                <Check className="invisible size-4 group-data-[selected]:visible" />
                <span>{category?.nameRu}</span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
      <div className="center-row gap-1 w-full">
        <p className="min-w-32">Подкатегория</p>
        <Combobox
          value={comboboxSelectedSubCategory}
          onChange={handleSubCategorySelection}
          onClose={() => setSubCatQuery("")}
        >
          <div className="relative w-full">
            <ComboboxInput
              className="basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
              displayValue={(subCategory) => subCategory?.nameRu}
              onChange={(event) => setSubCatQuery(event.target.value)}
              placeholder="Подкатегория"
            />
            <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
              <ChevronDown className="ml-auto mr-2 size-6" />
            </ComboboxButton>
          </div>
          <ComboboxOptions anchor="bottom" transition className="combo">
            {filteredSubCategories?.map((subCategory) => (
              <ComboboxOption
                key={subCategory?.id}
                value={subCategory}
                className="group combo-option"
              >
                <Check className="invisible size-4 group-data-[selected]:visible" />
                <span>{subCategory?.nameRu}</span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
    </div>
  );
}
