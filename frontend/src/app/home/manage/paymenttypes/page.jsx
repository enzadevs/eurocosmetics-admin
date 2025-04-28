"use client";

import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { apiUrl, SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Switch,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";

const fetchPaymentTypes = async () => {
  const response = await fetch(`${apiUrl}/paymenttypes/fetch/all`);
  const data = await response.json();
  return data;
};

export default function PaymentTypesPage() {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [activeStates, setActiveStates] = useState({});
  const { handleSubmit } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const getData = async () => {
      const response = await fetchPaymentTypes();
      setPaymentTypes(response?.paymentTypes);

      const initialStates = {};
      response?.paymentTypes.forEach((item) => {
        initialStates[item.id] = item.isActive;
      });
      setActiveStates(initialStates);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchPaymentTypes();
    setPaymentTypes(response?.paymentTypes);
  };

  const updatePaymentType = async (data, id) => {
    try {
      const response = await fetch(`${apiUrl}/paymenttypes/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: activeStates[id],
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Способ оплаты обновлено." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Обновил способ оплаты с ID : ${id}`,
          "UPDATE"
        );

        handlePageRefresh();
      } else {
        ErrorToast({
          errorText: "Произошла ошибка при обновлении способа оплаты.",
        });
      }
    } catch (err) {
      console.error(err);
      ErrorToast({
        errorText: "Произошла ошибка при обновлении способа оплаты.",
      });
    }
  };

  const toggleIsActive = (id) => {
    setActiveStates((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  return (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Способ оплаты</h2>
      </div>
      <div className="center-col">
        <div className="basic-border flex flex-col px-2 pb-2 h-fit w-full max-w-2xl">
          <div className="flex flex-col items-center justify-between h-full">
            {paymentTypes?.map((item) => {
              return (
                <Disclosure
                  key={item.id}
                  as="div"
                  className="border-b border-support-200 flex flex-col gap-2 px-2 h-fit w-full"
                  defaultOpen={false}
                >
                  <DisclosureButton className="group flex items-center justify-between h-9 w-full">
                    <p>
                      {item.nameTm} / {item.nameRu}
                    </p>
                    <ChevronDown className="dark:text-support size-5 group-data-[open]:rotate-180" />
                  </DisclosureButton>
                  <DisclosurePanel>
                    <form
                      key={item.id}
                      className="flex flex-col gap-2 w-full"
                      onSubmit={handleSubmit((data) =>
                        updatePaymentType(data, item.id)
                      )}
                    >
                      <div className="bg-white dark:bg-dark basic-border center-row gap-4 p-2 h-9 w-full">
                        <p className="w-52">Способ оплаты доступна:</p>
                        <Switch
                          checked={activeStates[item.id]}
                          onChange={() => toggleIsActive(item.id)}
                          className="group relative flex cursor-pointer rounded-full bg-support dark:bg-darkTwo p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-primary data-[checked]:bg-primary ml-auto h-7 w-14"
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none inline-block size-5 translate-x-0 rounded-full bg-white ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7"
                          />
                        </Switch>
                      </div>
                      <button type="submit" className="btn-primary mb-2">
                        <span className="font-semibold">Сохранить</span>
                      </button>
                    </form>
                  </DisclosurePanel>
                </Disclosure>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
