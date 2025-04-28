import { useState, useEffect } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronDown, Check } from "lucide-react";

export default function UnitSelectorP({ unitRef, data }) {
  const [units] = useState([
    {
      id: 1,
      value: "Piece",
      nameRu: "Штук",
    },
    {
      id: 2,
      value: "Kg",
      nameRu: "Кг.",
    },
    {
      id: 3,
      value: "Litre",
      nameRu: "Литр",
    },
  ]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(null);

  useEffect(() => {
    if (data) {
      setComboboxSelectedItem(data);
      unitRef.current = data?.value;
    } else {
      setComboboxSelectedItem(units[0]);
      unitRef.current = units[0].value;
    }
  }, [data, unitRef, units]);

  const handleSelectChange = (unit) => {
    setComboboxSelectedItem(unit);
    unitRef.current = unit?.value || null;
  };

  const filteredUnits =
    query === ""
      ? units
      : units.filter((unit) =>
          unit.nameRu.toLowerCase().includes(query.toLowerCase())
        );

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
            displayValue={(unit) => unit?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Единица"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredUnits.map((unit) => (
            <ComboboxOption
              key={unit.id}
              value={unit}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{unit.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
