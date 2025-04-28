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

const fetchData = async () => {
  const response = await fetch(`${apiUrl}/subcategories/fetch/all`);
  const data = await response.json();
  return data.subCategories;
};

export default function SubCategoryPicker({ passedProp, data }) {
  const [subCategories, setSubCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] =
    useState(subCategories);
  const [selecteditemId, setSelecteditemId] = useState(passedProp.current);

  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchData();
      const allOption = { id: 0, name: "Все" };
      const allData = data ? fetchedData : [allOption, ...fetchedData];

      setSubCategories(allData);

      if (data) {
        setComboboxSelectedItem(data);
        passedProp.current = data?.id;
      } else {
        setComboboxSelectedItem(null);
        passedProp.current = allOption.id;
      }
    };

    getData();
  }, [data, passedProp]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelecteditemId(value?.id || null);
    passedProp.current = value?.id || null;
  };

  const filteredOptions =
    query === ""
      ? subCategories
      : subCategories.filter((item) => {
          return item.nameRu.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className="flex items-center justify-between h-10 w-full">
      <Combobox
        value={comboboxSelectedItem}
        onChange={handleSelectChange}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full">
          <ComboboxInput
            className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(item) => item?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Подкатегория"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-5" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredOptions?.map((item) => (
            <ComboboxOption
              key={item?.id}
              value={item}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{item?.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
