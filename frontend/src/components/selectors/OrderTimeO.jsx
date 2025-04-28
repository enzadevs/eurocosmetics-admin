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

const fetchOrderTimes = async () => {
  const response = await fetch(`${apiUrl}/ordertimes/fetch/all`);
  const data = await response.json();
  return data.orderTimes;
};

export default function OrderTimeSelector({ orderTimeIdRef }) {
  const [orderTimes, setOrderTimes] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(null);

  useEffect(() => {
    const getOrderTimes = async () => {
      const fetchedData = await fetchOrderTimes();
      const allTimesOption = { id: 0, nameRu: "Все", time: "" };
      const initialOrderTimes = fetchedData.length
        ? [allTimesOption, ...fetchedData]
        : [allTimesOption];

      setOrderTimes(initialOrderTimes);

      setComboboxSelectedItem(null);
      orderTimeIdRef.current = allTimesOption.id;
    };

    getOrderTimes();
  }, [orderTimeIdRef]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    orderTimeIdRef.current = value?.id || null;
  };

  const filteredOrderTimes =
    query === ""
      ? orderTimes
      : orderTimes.filter((orderTime) =>
          orderTime.nameRu.toLowerCase().includes(query.toLowerCase())
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
            className="basic-border-2 focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(orderTime) =>
              orderTime ? `${orderTime.nameRu} ${orderTime.time}` : ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Время"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredOrderTimes.map((orderTime) => (
            <ComboboxOption
              key={orderTime.id}
              value={orderTime}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>
                {orderTime?.nameRu} {orderTime?.time}
              </span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
