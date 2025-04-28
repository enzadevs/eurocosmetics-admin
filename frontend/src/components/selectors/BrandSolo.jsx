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
  const response = await fetch(`${apiUrl}/brands/fetch/client`);
  const data = await response.json();
  return data.brands;
};

export default function BrandSelectorSolo({ brandIdRef, data }) {
  const [brands, setBrand] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(brands);
  const [selectedbrandId, setSelectedbrandId] = useState(brandIdRef.current);

  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchData();
      const allOption = { id: 0, name: "Все" };
      const allbrands = data ? fetchedData : [allOption, ...fetchedData];

      setBrand(allbrands);

      if (data) {
        setComboboxSelectedItem(data);
        brandIdRef.current = data?.id;
      } else {
        setComboboxSelectedItem(null);
        brandIdRef.current = allOption.id;
      }
    };

    getData();
  }, [data, brandIdRef]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelectedbrandId(value?.id || null);
    brandIdRef.current = value?.id || null;
  };

  const filteredData =
    query === ""
      ? brands
      : brands.filter((brand) => {
          return brand.name.toLowerCase().includes(query.toLowerCase());
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
            displayValue={(brand) => brand?.name}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Бренд"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredData?.map((brand) => (
            <ComboboxOption
              key={brand?.id}
              value={brand}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{brand?.name}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
