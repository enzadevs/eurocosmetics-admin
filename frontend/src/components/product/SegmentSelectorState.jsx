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

const fetchData = async () => {
  const response = await fetch(`${apiUrl}/segments/fetch/all`);
  const data = await response.json();
  return data.segments;
};

export default function SegmentSelectorState({ value, onChange }) {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchData();
      const allDataOption = { id: null, nameRu: "Все" };
      const allData = [allDataOption, ...fetchedData];

      setData(allData);

      const currentItem =
        allData.find((item) => item.id === value) || allDataOption;
      setSelectedItem(currentItem);
    };

    getData();
  }, [value]);

  const handleSelectChange = (item) => {
    setSelectedItem(item);
    onChange(item?.id);
  };

  const filteredData =
    query === ""
      ? data
      : data.filter((item) =>
          item.nameRu.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="flex items-center justify-between h-10 grow w-full">
      <Combobox
        value={selectedItem}
        onChange={handleSelectChange}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full">
          <ComboboxInput
            className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(item) => item?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Категория"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-5" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredData.map((item) => (
            <ComboboxOption
              key={item.id}
              value={item}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{item.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
