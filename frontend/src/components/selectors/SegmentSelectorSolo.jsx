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

export default function SegmentSelectorSolo({ passedProp, data }) {
  const [segments, setSegments] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(segments);
  const [selectedSegment, setSelectedSegment] = useState(passedProp.current);

  useEffect(() => {
    const getsegments = async () => {
      const fetchedData = await fetchData();
      setSegments(fetchedData);

      if (data) {
        setComboboxSelectedItem(data);
        passedProp.current = data?.id;
      } else {
        setComboboxSelectedItem(null);
      }
    };

    getsegments();
  }, [data, passedProp]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelectedSegment(value?.id || null);
    passedProp.current = value?.id || null;
  };

  const filteredOptions =
    query === ""
      ? segments
      : segments.filter((segment) => {
          return segment.nameRu.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className="flex items-center justify-between h-10 grow w-full">
      <Combobox
        value={comboboxSelectedItem}
        onChange={handleSelectChange}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full">
          <ComboboxInput
            className="dark:bg-dark basic-border-2 dark:text-support focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(segment) => segment?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Сегмент"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredOptions?.map((segment) => (
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
  );
}
