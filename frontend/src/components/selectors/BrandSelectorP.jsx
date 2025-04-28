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
  const response = await fetch(`${apiUrl}/brands/fetch/all/`);
  const data = await response.json();
  return data.brands;
};

export default function BrandSelectorP({ passedProp, data }) {
  const [brands, setbrands] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(passedProp.current);

  const defaultBrandId = "3c83677d-bf5d-4a41-b7a3-a2a3d9d26ddc";

  useEffect(() => {
    const getData = async () => {
      const fetchedbrands = await fetchData();
      setbrands(fetchedbrands);

      const defaultBrand = fetchedbrands.find(
        (brand) => brand.id === defaultBrandId
      );
      if (defaultBrand) {
        setComboboxSelectedItem(defaultBrand);
        passedProp.current = defaultBrand.id;
      }

      if (data) {
        const selectedBrand = fetchedbrands.find(
          (brand) => brand.id === data.id
        );
        setComboboxSelectedItem(selectedBrand);
        passedProp.current = selectedBrand?.id || null;
      }
    };

    getData();
  }, [data, passedProp]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelectedBrandId(value?.id || null);
    passedProp.current = value?.id || null;
  };

  const filteredbrands =
    query === ""
      ? brands
      : brands.filter((brand) => {
          return brand.name.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className="flex items-center justify-between h-9 md:h-10 w-full">
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
            <ChevronDown className="ml-auto mr-2 size-5" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredbrands?.map((brand) => (
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
