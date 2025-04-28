import { apiUrl } from "@/components/utils/utils";
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
  segmentIdRef,
  data,
}) {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedCategory, setComboboxSelectedCategory] =
    useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categoryIdRef.current
  );

  const [subCategories, setSubCategories] = useState([]);
  const [subCatQuery, setSubCatQuery] = useState("");
  const [comboboxSelectedSubCategory, setComboboxSelectedSubCategory] =
    useState(subCategories);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(
    subCategoryIdRef.current
  );

  const [segments, setSegments] = useState([]);
  const [segmentQuery, setSegmentQuery] = useState("");
  const [comboboxSelectedSegment, setComboboxSelectedSegment] =
    useState(subCategories);
  const [selectedSegmentId, setSelectedSegmentId] = useState(
    segmentIdRef.current
  );

  useEffect(() => {
    const getData = async () => {
      const fetchedCategories = await fetchCategories();
      setCategories(fetchedCategories);
      setComboboxSelectedCategory(null);

      if (data) {
        setComboboxSelectedCategory(data?.Category);
        setComboboxSelectedSubCategory(data?.SubCategory);
        setComboboxSelectedSegment(data?.Segment);
        categoryIdRef.current = data?.Category?.id;
        subCategoryIdRef.current = data?.SubCategory?.id;
        // segmentIdRef.current = data?.Segment?.id;

        try {
          const subCatResponse = await fetch(
            `${apiUrl}/categories/fetch/single/${categoryIdRef?.current}`
          );

          const segmentResponse = await fetch(
            `${apiUrl}/subcategories/fetch/single/${subCategoryIdRef?.current}`
          );

          if (subCatResponse.ok || segmentResponse.ok) {
            const subCatData = await subCatResponse.json();
            const segmentData = await segmentResponse.json();
            setSubCategories(subCatData?.SubCategories);
            setSegments(segmentData?.Segments);
          }
        } catch (err) {
          console.log(err);
        }
      } else {
        setComboboxSelectedCategory(null);
        setComboboxSelectedSubCategory(null);
        setComboboxSelectedSegment(null);
      }
    };

    getData();
  }, [categoryIdRef, subCategoryIdRef, segmentIdRef, data]);

  const handleCategorySelection = async (value) => {
    setComboboxSelectedCategory(value);
    setSelectedCategoryId(value?.id ? value?.id : null);
    categoryIdRef.current = value?.id || null;
    setComboboxSelectedSubCategory(null);
    setComboboxSelectedSegment(null);

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
    setComboboxSelectedSegment(null);

    if (value) {
      try {
        const response = await fetch(
          `${apiUrl}/subcategories/fetch/single/${value?.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setSegments(data.Segments);
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleSegmentSelection = (value) => {
    setComboboxSelectedSegment(value);
    setSelectedSegmentId(value?.id || null);
    console.log("value is : ", value.id);
    segmentIdRef.current = value?.id || null;
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

  const filteredSegments =
    segmentQuery === ""
      ? segments
      : segments.filter((segment) => {
          return segment.nameRu
            .toLowerCase()
            .includes(segmentQuery.toLowerCase());
        });

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between h-9 md:h-10 w-full">
        <p className="min-w-32">Категория</p>
        <Combobox
          value={comboboxSelectedCategory}
          onChange={handleCategorySelection}
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
              <ChevronDown className="ml-auto mr-2 size-5" />
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
      <div className="flex items-center justify-between h-9 md:h-10 w-full">
        <p className="min-w-32">Подкатегория:</p>
        <Combobox
          value={comboboxSelectedSubCategory}
          onChange={handleSubCategorySelection}
          onClose={() => setSubCatQuery("")}
        >
          <div className="relative w-full">
            <ComboboxInput
              className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
              displayValue={(subCategory) => subCategory?.nameRu}
              onChange={(event) => setSubCatQuery(event.target.value)}
              placeholder="Подкатегория"
            />
            <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
              <ChevronDown className="ml-auto mr-2 size-5" />
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
      <div className="flex items-center justify-between h-9 md:h-10 w-full">
        <p className="min-w-32">Сегмент:</p>
        <Combobox
          value={comboboxSelectedSegment}
          onChange={handleSegmentSelection}
          onClose={() => setSegmentQuery("")}
        >
          <div className="relative w-full">
            <ComboboxInput
              className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
              displayValue={(segment) => segment?.nameRu}
              onChange={(event) => setSegmentQuery(event.target.value)}
              placeholder="Сегмент"
            />
            <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
              <ChevronDown className="ml-auto mr-2 size-5" />
            </ComboboxButton>
          </div>
          <ComboboxOptions anchor="bottom" transition className="combo">
            {filteredSegments?.map((segment) => (
              <ComboboxOption
                key={segment?.id}
                value={segment}
                className="group combo-option"
              >
                <Check className="invisible size-4 group-data-[selected]:visible" />
                <span>{segment?.nameRu}</span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
    </div>
  );
}
