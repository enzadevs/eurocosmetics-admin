"use client";

import * as XLSX from "xlsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { apiUrl } from "@/components/utils/utils";
import { useState, useRef, useCallback, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

const headerMapping = {
  barcode: "Баркод",
  nameRu: "Название",
  incomePrice: "Цена (приход)",
  currentSellPrice: "Цена (продажа)",
  stock: "Склад",
};

const columnWidths = {
  barcode: 150,
  nameRu: 600,
  incomePrice: 200,
  currentSellPrice: 200,
  stock: 200,
  default: 120,
};

export default function ExportPage() {
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sheetFileNameref = useRef();

  const getColumnWidth = (key) => {
    return columnWidths[key] || columnWidths.default;
  };

  const exportSheetFile = useCallback(
    (name) => {
      if (tableData.length === 0) {
        alert(
          "Нет данных для экспорта. Пожалуйста, получите данные из сервера."
        );
        return;
      }

      if (sheetFileNameref.current.value === "") {
        alert("Пожалуйста, укажите имя файла для экспорта.");
        return;
      }

      const workSheet = XLSX.utils.json_to_sheet(tableData);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, "Data");
      XLSX.writeFile(workBook, name + ".xlsx");
    },
    [tableData]
  );

  const fetchOrdersFromApi = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/synchronize/export`);
      const raw_data = await response.json();
      const processedData = raw_data.map((item) => ({ ...item }));
      setTableData(processedData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Ошибка при получении данных");
    } finally {
      setIsLoading(false);
    }
  };

  const VirtualizedRow = ({ index, style, data }) => {
    return (
      <div style={style} className="flex border-b border-support-200">
        {Object.keys(headerMapping).map((key, colIndex) => (
          <div
            key={`${index}-${colIndex}`}
            className="dark:text-grey-200 p-2 truncate"
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

  const TableHeader = () => (
    <div className="dark:bg-darkTwo flex border-b border-support-200 bg-support font-semibold sticky top-0">
      {Object.entries(headerMapping).map(([key, value], index) => (
        <div
          key={index}
          className="dark:bg-darkTwo p-2 dark:text-grey-200"
          style={{
            width: getColumnWidth(key),
            minWidth: getColumnWidth(key),
            maxWidth: getColumnWidth(key),
          }}
        >
          {value}
        </div>
      ))}
    </div>
  );

  const TableContainer = ({ data, height, width }) => {
    const innerWidth = useMemo(() => {
      return Object.keys(headerMapping).reduce(
        (total, key) => total + getColumnWidth(key),
        0
      );
    }, []);

    return (
      <div className="h-full">
        <div style={{ width: Math.max(width, innerWidth) }}>
          <TableHeader />
          <List
            height={height}
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
      <div className="center-row h-12">
        <BackForthButtons />
        <h2>Экспорт данных</h2>
        <button
          onClick={fetchOrdersFromApi}
          className="btn-primary ml-auto mr-2 px-4 h-10"
        >
          Получить данные
        </button>
        <input
          ref={sheetFileNameref}
          type="text"
          className="input-primary dark:text-grey-200 mr-2 pl-4 max-w-72"
          placeholder="Имя файла при экспорте"
        />
        <button
          onClick={() => exportSheetFile(sheetFileNameref.current.value)}
          className="btn-primary px-4 h-10"
        >
          Экспорт
        </button>
      </div>
      {isLoading ? (
        <p className="text-center">Загрузка...</p>
      ) : (
        <div className="flex-1 overflow-auto">
          {tableData.length > 0 && (
            <div className="overflow-hidden h-full">
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
          )}
        </div>
      )}
    </div>
  );
}
