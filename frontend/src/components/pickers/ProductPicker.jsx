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

const fetchData = async (query) => {
  const response = await fetch(`${apiUrl}/products/all`, {
    method: "POST",
    body: JSON.stringify({ query }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data.products;
};

export default function ProductPicker({ passedProp, data }) {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [comboboxSelectedItem, setComboboxSelectedItem] = useState(null);
  const [selectedBarcode, setSelectedProductBarcode] = useState(
    passedProp.current
  );

  useEffect(() => {
    const getProducts = async () => {
      if (data) {
        setComboboxSelectedItem(data);
        passedProp.current = data?.barcode;
      } else {
        setComboboxSelectedItem(null);
      }
    };

    getProducts();
  }, [data, passedProp]);

  const handleSelectChange = (value) => {
    setComboboxSelectedItem(value);
    setSelectedProductBarcode(value?.barcode || null);
    passedProp.current = value?.barcode || null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query !== "") {
      const fetchedProducts = await fetchData(query);
      setProducts(fetchedProducts);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:justify-between gap-1 w-full">
      <div className="center-row gap-1 w-full">
        <p className="min-w-24 md:min-w-32">Товар:</p>
        <Combobox value={comboboxSelectedItem} onChange={handleSelectChange}>
          <div className="relative w-full">
            <ComboboxInput
              className="basic-border-2 focus:border-primary outline-none pl-2 pr-9 h-9 md:h-10 w-full"
              displayValue={(product) => product?.nameRu}
              placeholder="Товар"
            />
            <ComboboxButton className="center-col absolute inset-y-0 text-dark hover:text-primary h-full w-full">
              <ChevronDown className="ml-auto mr-2 size-5" />
            </ComboboxButton>
          </div>
          <ComboboxOptions
            anchor="bottom"
            transition
            className="combo custom-scrollbar"
          >
            {products?.map((product) => (
              <ComboboxOption
                key={product?.barcode}
                value={product}
                className="group combo-option"
              >
                <Check className="invisible size-4 group-data-[selected]:visible" />
                <span className="line-clamp-1 text-sm">{product?.nameRu}</span>
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Combobox>
      </div>
      <div className="center-row gap-1 w-full">
        <input
          className="basic-border-2 focus:border-primary outline-none px-2 h-9 md:h-10 w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название товара"
        />
        <button onClick={handleSearch} className="btn-primary px-2">
          Поиск
        </button>
      </div>
    </div>
  );
}
