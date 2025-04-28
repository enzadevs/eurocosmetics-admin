import { useState, useEffect } from "react";

export default function DiscountSelector({
  discountTypeRef,
  discountValueRef,
  currentSellPrice,
  setFinalPrice,
}) {
  const [percentageDiscount, setPercentageDiscount] = useState("");
  const [fixedDiscount, setFixedDiscount] = useState("");
  const [calculationText, setCalculationText] = useState("");
  const [inputType, setInputType] = useState(null);

  useEffect(() => {
    if (discountTypeRef.current === "PERCENTAGE") {
      setPercentageDiscount(discountValueRef.current);
      setInputType("PERCENTAGE");
    } else if (discountTypeRef.current === "FIXED") {
      setFixedDiscount(discountValueRef.current);
      setInputType("FIXED");
    }
  }, [discountTypeRef.current, discountValueRef.current]);

  useEffect(() => {
    let newPrice = currentSellPrice;
    let calculation = `${currentSellPrice}`;

    if (inputType === "PERCENTAGE" && percentageDiscount) {
      const discountAmount =
        (Number(percentageDiscount) / 100) * Number(currentSellPrice);
      newPrice = Number(currentSellPrice) - discountAmount;
      calculation += ` - ${percentageDiscount}% = ${newPrice.toFixed(2)}`;
      setFixedDiscount(discountAmount.toFixed(2));
    } else if (inputType === "FIXED" && fixedDiscount) {
      newPrice = Number(fixedDiscount);
      calculation = `(Текущая цена ${currentSellPrice} M). Цена со скидкой - ${newPrice.toFixed(
        2
      )} M`;

      const calculatedPercentage =
        ((Number(currentSellPrice) - Number(fixedDiscount)) /
          Number(currentSellPrice)) *
        100;

      setPercentageDiscount(calculatedPercentage.toFixed(2));
    }

    setFinalPrice(newPrice);
    setCalculationText(calculation);

    discountTypeRef.current = inputType;
    discountValueRef.current =
      inputType === "PERCENTAGE" ? percentageDiscount : fixedDiscount;
  }, [
    discountTypeRef,
    discountValueRef,
    percentageDiscount,
    fixedDiscount,
    inputType,
    currentSellPrice,
  ]);

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    setPercentageDiscount(value);
    if (value === "") {
      setFixedDiscount("");
    }
    setInputType("PERCENTAGE");
  };

  const handleFixedChange = (e) => {
    const value = e.target.value;
    setFixedDiscount(value);
    if (value === "") {
      setPercentageDiscount("");
    }
    setInputType("FIXED");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col md:flex-row items-center gap-2 w-full">
        <div className="center-row justify-between gap-1 h-9 md:h-10 w-full">
          <p className="min-w-32">Скидка %:</p>
          <input
            type="number"
            className="input-primary dark:text-support px-2 w-full"
            placeholder="Процент скидки"
            step="0.01"
            value={percentageDiscount}
            onChange={handlePercentageChange}
          />
        </div>
        <div className="center-row justify-between gap-1 h-9 md:h-10 w-full">
          <p className="min-w-32">Сумма скидки:</p>
          <input
            type="number"
            className="input-primary dark:text-support px-2 w-full"
            placeholder="Сумма скидки"
            step="0.01"
            value={fixedDiscount}
            onChange={handleFixedChange}
          />
        </div>
      </div>
      <div className="border-b-2 border-support-200 center-row justify-between h-10 w-full">
        <p className="min-w-32">Цена:</p>
        <p className="font-bold text-primary">
          {calculationText ? (
            <>{calculationText}</>
          ) : (
            <>{currentSellPrice ? currentSellPrice + " M" : 0}</>
          )}
        </p>
      </div>
    </div>
  );
}
