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

const fetchStatuses = async () => {
  const response = await fetch(`${apiUrl}/statuses/fetch/all`);
  const data = await response.json();
  return data.productStatuses;
};

export default function ProductStatusSelectorP({ productStatusIdRef, data }) {
  const [stasuses, setStasuses] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(stasuses);
  const [selectedStatusId, setStatusId] = useState(productStatusIdRef.current);

  useEffect(() => {
    const getStatuses = async () => {
      const fetchedStatuses = await fetchStatuses();
      setStasuses(fetchedStatuses);

      if (data) {
        setComboboxSelectedItem(data);
        productStatusIdRef.current = data?.id;
      } else {
        setComboboxSelectedItem(null);
      }
    };

    getStatuses();
  }, [data, productStatusIdRef]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setStatusId(value?.id || null);
    productStatusIdRef.current = value?.id || null;
  };

  const filteredStatuses =
    query === ""
      ? stasuses
      : stasuses.filter((status) => {
          return status.nameRu.toLowerCase().includes(query.toLowerCase());
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
            displayValue={(status) => status?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Статус"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-5" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredStatuses?.map((status) => (
            <ComboboxOption
              key={status?.id}
              value={status}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{status?.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
