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

const fetchOrderStasuses = async () => {
  const response = await fetch(`${apiUrl}/orderstatuses/fetch/all`);
  const data = await response.json();
  return data.orderStatuses;
};

export default function OrderStatusSelector({ orderStatusIdRef }) {
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] =
    useState(orderStatuses);
  const [selectedOrderStatus, setSelectedOrderStatusId] = useState(
    orderStatusIdRef.current
  );

  useEffect(() => {
    const getOrderStatuses = async () => {
      const fetchedData = await fetchOrderStasuses();
      const allStatuses = { id: 0, nameRu: "Все" };
      const initialStatuses = fetchedData.length
        ? [allStatuses, ...fetchedData]
        : [allStatuses];

      setOrderStatuses(initialStatuses);

      setComboboxSelectedItem(null);
      orderStatusIdRef.current = allStatuses.id;
    };

    getOrderStatuses();
  }, [orderStatusIdRef]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelectedOrderStatusId(value?.id || null);
    orderStatusIdRef.current = value?.id || null;
  };

  const filteredOrderStatuses =
    query === ""
      ? orderStatuses
      : orderStatuses.filter((orderStatus) => {
          return orderStatus.nameRu.toLowerCase().includes(query.toLowerCase());
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
            className="basic-border-2 focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
            displayValue={(orderStatus) => orderStatus?.nameRu}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Статус"
          />
          <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
            <ChevronDown className="ml-auto mr-2 size-6" />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom" transition className="combo">
          {filteredOrderStatuses?.map((orderStatus) => (
            <ComboboxOption
              key={orderStatus?.id}
              value={orderStatus}
              className="group combo-option"
            >
              <Check className="invisible size-4 group-data-[selected]:visible" />
              <span>{orderStatus?.nameRu}</span>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
