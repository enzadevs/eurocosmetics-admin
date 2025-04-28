"use client";

import * as XLSX from "xlsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { apiUrl } from "@/components/utils/utils";
import { useState, useRef, useMemo } from "react";
import { ErrorToast } from "@/components/utils/utils";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

const headerMapping = {
  barcode: "Баркод",
  nameRu: "Имя товара (рус.)",
  incomePrice: "Цена (приход)",
  currentSellPrice: "Цена (продажа)",
  stock: "Склад",
  reason: "Причина",
};

const columnWidths = {
  barcode: 200,
  nameRu: 500,
  stock: 100,
  incomePrice: 140,
  currentSellPrice: 140,
  reason: 400,
  default: 140,
};

export default function ImportProductsPage() {
  const inputRef = useRef(null);
  const [tableData, setTableData] = useState([]);
  const [failedProducts, setFailedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFailedProducts, setShowFailedProducts] = useState(false);

  const handleFileUpload = (event) => {
    setIsLoading(true);
    const importedFile = event.target.files[0];

    if (!importedFile) {
      alert("Пожалуйста, выберите файл Excel для импорта.");
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(importedFile);

    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      const desiredHeaders = [
        "barcode",
        "nameRu",
        "stock",
        "incomePrice",
        "currentSellPrice",
      ];
      const filteredData = parsedData.map((row) => {
        return Object.keys(row)
          .filter((header) => desiredHeaders.includes(header))
          .reduce((acc, header) => {
            const value = row[header];
            acc[header] = typeof value === "string" ? value : value.toString();
            return acc;
          }, {});
      });

      console.log(parsedData);

      setTableData(filteredData);
      setFailedProducts([]);
      setShowFailedProducts(false);
      setIsLoading(false);
    };
  };

  const sendRequest = async () => {
    if (tableData.length <= 0) {
      alert("Загрузите файл для синхронизации.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${apiUrl}/synchronize/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: tableData }),
      });

      const responseData = await response.json();

      if (response.ok) {
        alert(responseData.message);
        if (responseData.failedProducts?.length > 0) {
          setFailedProducts(responseData.failedProducts);
          setShowFailedProducts(true);
        }
      } else {
        ErrorToast({
          errorText: responseData.message,
        });
      }
    } catch (err) {
      ErrorToast({
        errorText: "Вышла серверная ошибка.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getColumnWidth = (key) => {
    return columnWidths[key] || columnWidths.default;
  };

  const VirtualizedRow = ({ index, style, data }) => {
    const columns = Object.keys(data[0]);

    return (
      <div style={style} className="flex border-b border-support-200">
        {columns.map((key, colIndex) => (
          <div
            key={`${index}-${colIndex}`}
            className="dark:bg-darkTwo p-2 truncate dark:text-grey-200"
            style={{
              width: getColumnWidth(key),
              minWidth: getColumnWidth(key),
              maxWidth: getColumnWidth(key),
            }}
          >
            {data[index][key]}
          </div>
        ))}
      </div>
    );
  };

  const TableHeader = ({ headers }) => (
    <div className="dark:bg-dark flex border-b border-support-200 bg-support font-semibold sticky top-0">
      {headers.map((header, index) => (
        <div
          key={index}
          className="dark:bg-darkTwo p-2 dark:text-grey-200"
          style={{
            width: getColumnWidth(header),
            minWidth: getColumnWidth(header),
            maxWidth: getColumnWidth(header),
          }}
        >
          {headerMapping[header] || header}
        </div>
      ))}
    </div>
  );

  const TableContainer = ({ data, height, width }) => {
    const innerWidth = useMemo(() => {
      return Object.keys(data[0]).reduce(
        (total, key) => total + getColumnWidth(key),
        0
      );
    }, [data]);

    return (
      <div className="h-full">
        <div style={{ width: Math.max(width, innerWidth) }}>
          <TableHeader headers={Object.keys(data[0])} />
          <List
            height={height - 40}
            width={Math.max(width, innerWidth)}
            itemCount={data.length}
            itemSize={40}
            itemData={data}
          >
            {VirtualizedRow}
          </List>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen" suppressHydrationWarning>
      <div className="center-row">
        <BackForthButtons />
        <h2>Импорт данных</h2>
        <div className="center-row gap-2 ml-auto h-12">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current.click()}
            className="btn-primary px-4 h-10"
            disabled={isProcessing}
          >
            Открыть файл Excel
          </button>
          <button
            onClick={sendRequest}
            className="btn-primary px-4 h-10"
            disabled={isProcessing}
          >
            {isProcessing ? "Обработка..." : "Синхронизировать"}
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-center">Загрузка...</p>
      ) : (
        <div className="flex-1 overflow-auto">
          {showFailedProducts && failedProducts.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-red-50 border-b border-red-200">
                <h3 className="text-red-700">
                  Не удалось импортировать следующие товары:
                </h3>
              </div>
              <div className="flex-1">
                <AutoSizer>
                  {({ height, width }) =>
                    failedProducts.length > 0 && (
                      <TableContainer
                        data={failedProducts}
                        height={height}
                        width={width}
                      />
                    )
                  }
                </AutoSizer>
              </div>
              <div className="p-4">
                <button
                  onClick={() => setShowFailedProducts(false)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Показать исходную таблицу
                </button>
              </div>
            </div>
          ) : tableData.length > 0 ? (
            <div className="overflow-y-hidden h-full">
              <AutoSizer>
                {({ height, width }) => (
                  <TableContainer
                    data={tableData}
                    height={height}
                    width={width}
                  />
                )}
              </AutoSizer>
            </div>
          ) : (
            <div className="flex flex-col items-center p-4">
              <h2>
                Чтобы Синхронизация прошла успешно, Ваш Excel файл должен быть в
                таком формате:
              </h2>
              <div className="bg-support dark:bg-darkTwo flex justify-between border border-support-200 dark:border-transparent rounded w-full p-2 max-w-3xl">
                <div className="flex flex-col items-center mx-4">
                  <span className="dark:text-grey-200">Склад</span>
                  <span className="dark:text-grey-200 font-bold italic">
                    stock
                  </span>
                </div>
                <div className="flex flex-col items-center mx-4">
                  <span className="dark:text-grey-200">Баркод</span>
                  <span className="dark:text-grey-200 font-bold italic">
                    barcode
                  </span>
                </div>
                <div className="flex flex-col items-center mx-4">
                  <span className="dark:text-grey-200">Цена (приход)</span>
                  <span className="dark:text-grey-200 font-bold italic">
                    incomePrice
                  </span>
                </div>
                <div className="flex flex-col items-center mx-4">
                  <span className="dark:text-grey-200">Цена (продажа)</span>
                  <span className="dark:text-grey-200 font-bold italic">
                    currentSellPrice
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
