import toast from "react-simple-toasts";

export function SuccessToast({ successText }) {
  toast(successText, {
    className:
      "bg-primary rounded shadow-sm text-white text-center px-4 h-9 md:h-10",
    duration: 1750,
    position: "top-center",
    maxVisibleToasts: 5,
  });
}

export function ErrorToast({ errorText }) {
  toast(errorText, {
    className: "bg-red-200 rounded text-red-600 text-center px-4 h-9 md:h-10",
    duration: 1750,
    position: "top-center",
    maxVisibleToasts: 5,
  });
}

export const apiUrl = "http://eurocos.alemtilsimat.com/api";
