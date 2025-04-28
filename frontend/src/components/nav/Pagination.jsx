import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({
  onPageChange,
  totalPages,
  initialPage = 1,
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  const handleInputSubmit = () => {
    const page = parseFloat(inputValue, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      onPageChange(page);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    onPageChange(page);
  };

  const getPageRange = () => {
    const range = [];
    let start = Math.max(1, currentPage - 5);
    let end = Math.min(totalPages, currentPage + 5);

    if (currentPage <= 6) {
      end = Math.min(totalPages, 10);
    }

    if (currentPage >= totalPages - 5) {
      start = Math.max(1, totalPages - 9);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  const renderPageButtons = () => {
    const range = getPageRange();
    const showMiddleEllipsis = totalPages > 15;

    return (
      <div className="center-row gap-1">
        {currentPage > 6 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={`btn-small-2 center-col size-9 md:size-10 ${
                currentPage === 1 ? "active" : ""
              }`}
            >
              1
            </button>
            {showMiddleEllipsis && (
              <span className="btn-small-2 center-col size-9 md:size-10">
                ...
              </span>
            )}
          </>
        )}
        {range.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`btn-small-2 center-col size-9 md:size-10 ${
              currentPage === page ? "active" : ""
            }`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 5 && (
          <>
            {showMiddleEllipsis && (
              <span className="btn-small-2 center-col size-9 md:size-10">
                ...
              </span>
            )}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`btn-small-2 center-col size-9 md:size-10 ${
                currentPage === totalPages ? "active" : ""
              }`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center md:flex-row md:justify-between gap-2 mt-auto h-fit">
      <div className="center-row gap-1 pb-1 custom-scrollbar w-full">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="btn-small-2 center-col size-9 md:size-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {renderPageButtons()}
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="btn-small-2 center-coll size-9 md:size-10"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      <div className="center-row gap-1">
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputSubmit}
          min="1"
          max={totalPages}
          placeholder="Страница"
          className="dark:bg-darkTwo basic-border font-medium dark:text-support outline-none transition-all focus:border-primary px-4 h-9 md:h-10 w-32"
        />
        <p>Страниц:</p>
        <div className="btn-small">{totalPages}</div>
      </div>
    </div>
  );
}
