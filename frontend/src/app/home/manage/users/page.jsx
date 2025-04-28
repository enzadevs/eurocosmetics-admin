"use client";

import clsx from "clsx";
import BackForthButtons from "@/components/nav/BackForthButtons";
import { newAction } from "@/components/utils/ActionLogs";
import { apiUrl } from "@/components/utils/utils";
import { useAdminStore } from "@/components/utils/useAdminStore";
import { SuccessToast, ErrorToast } from "@/components/utils/utils";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Field,
  Label,
  Select,
} from "@headlessui/react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

const userRoles = [
  {
    id: 1,
    nameRu: "Менеджер",
    role: "MANAGER",
  },
  {
    id: 2,
    nameRu: "Кассир",
    role: "CASHIER",
  },
  {
    id: 3,
    nameRu: "Админ",
    role: "ADMIN",
  },
];

const fetchUsers = async () => {
  const response = await fetch(`${apiUrl}/admin/fetch`);
  const data = await response.json();
  return data;
};

export default function UsersPage() {
  const [data, setData] = useState([]);
  const [selectedRole, setSelectedRole] = useState(userRoles[0]?.role);
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();
  const { admin } = useAdminStore();

  useEffect(() => {
    const checkAuth = () => {
      if (admin?.user?.Role === "MANAGER") {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    const timer = setTimeout(checkAuth, 0);

    return () => clearTimeout(timer);
  }, [admin]);

  useEffect(() => {
    const getData = async () => {
      const response = await fetchUsers();
      setData(response?.users);
    };

    getData();
  }, []);

  const handlePageRefresh = async () => {
    const response = await fetchUsers();
    setData(response?.users);
  };

  const createNewUser = async (data) => {
    if (!data.username) {
      alert("Введите имя пользователя.");
      return;
    }

    if (!data.phoneNumber) {
      alert("Введите номер телефона.");
      return;
    }

    if (!data.password) {
      alert("Введите пароль.");
      return;
    }

    if (data.password !== data.confirmPassword) {
      alert("Пароли не совпадают.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/admin/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          username: data.username,
          password: data.password,
          role: selectedRole,
        }),
      });

      if (response.ok) {
        SuccessToast({ successText: "Добавлен новый пользователь." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Создал нового пользователя : ${data.username}`,
          "CREATE"
        );

        handlePageRefresh();
        reset();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/admin/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        SuccessToast({ successText: "Пользователь удален." });

        newAction(
          admin?.user?.Role,
          admin?.user?.username,
          `Удалил пользователя с ID : ${id}`,
          "DELETE"
        );

        handlePageRefresh();
      } else {
        const data = await response.json();
        ErrorToast({ errorText: data.message });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const confirmDelete = (event, id) => {
    event.preventDefault();
    if (window.confirm(`Вы уверены, что хотите удалить пользователя?`)) {
      handleDeleteUser(id);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return isAdmin ? (
    <div className="flex flex-col">
      <div className="center-row h-12">
        <BackForthButtons />
        <h2 className="ml-auto md:ml-0">Пользователи</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="basic-border flex flex-col gap-2 p-2 h-fit w-full md:w-1/2">
          <h3 className="dark:text-support">Пользователи</h3>
          {data?.map((item) => {
            return (
              <div
                className="bg-support dark:bg-darkTwo rounded flex flex-col text-dark dark:text-support transition hover:shadow-md p-2 w-full"
                key={item?.id}
              >
                <div className="center-row justify-between gap-2 w-full">
                  <p>Имя:</p>
                  <p className="font-medium">{item?.username}</p>
                </div>
                <div className="center-row justify-between gap-2 w-full">
                  <p>Роль:</p>
                  <p className="font-medium">
                    {item?.Role === "ADMIN" ? "Админ" : "Менеджер"}
                  </p>
                </div>
                <div className="center-row justify-between gap-2 w-full">
                  <p>Номер телефона:</p>
                  <p className="font-medium">{item?.phoneNumber}</p>
                </div>
                <div className="center-row justify-between gap-2 w-full">
                  <p>Создано:</p>
                  <p className="font-medium">{item?.createdAt}</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={(event) => confirmDelete(event, item.id)}
                >
                  Удалить
                </button>
              </div>
            );
          })}
        </div>
        <Disclosure
          as="div"
          className="basic-border flex flex-col gap-2 px-2 h-fit w-full md:w-1/2"
          defaultOpen={false}
        >
          <DisclosureButton className="group flex items-center justify-between h-9 md:h-10 w-full">
            <p className="font-bold">Новый пользователь</p>
            <ChevronDown className="dark:text-white size-5 group-data-[open]:rotate-180" />
          </DisclosureButton>
          <DisclosurePanel>
            <form
              onSubmit={handleSubmit(createNewUser)}
              className="flex flex-col gap-2 w-full"
              autoComplete="off"
            >
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Имя"
                {...register("username")}
              />
              <input
                type="text"
                className="input-primary dark:text-support px-2 w-full"
                defaultValue=""
                placeholder="Номер телефона"
                minLength={8}
                {...register("phoneNumber")}
              />
              <div className="center-row relative w-full">
                <span
                  className="rounded-l center-col absolute left-0 size-9 md:size-10 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <Eye className="text-dark dark:text-support h-5" />
                  ) : (
                    <EyeOff className="text-dark dark:text-support h-5" />
                  )}
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-primary dark:text-support pl-9 md:pl-10 pr-2"
                  placeholder="Новый пароль"
                  {...register("password")}
                />
              </div>
              <div className="center-row relative w-full">
                <span
                  className="rounded-l center-col absolute left-0 size-9 md:size-10 cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <Eye className="text-dark dark:text-support h-5" />
                  ) : (
                    <EyeOff className="text-dark dark:text-support h-5" />
                  )}
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-primary dark:text-support pl-9 md:pl-10 pr-2"
                  placeholder="Повторите новый пароль"
                  {...register("confirmPassword")}
                />
              </div>
              <Field className="flex flex-col gap-2">
                <Label className="text-dark dark:text-support">
                  Выберите роль
                </Label>
                <div className="relative">
                  <Select
                    className={clsx(
                      "dark:bg-darkTwo cursor-pointer basic-border block appearance-none text-dark dark:text-support p-2 pl-2 h-10 w-full",
                      "focus:outline-none",
                      "*:text-black"
                    )}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {userRoles?.map((item) => {
                      return (
                        <option key={item.id} value={item.role}>
                          {item?.nameRu}
                        </option>
                      );
                    })}
                  </Select>
                  <ChevronDown
                    className="group pointer-events-none absolute top-2.5 right-2.5 size-5 text-dark dark:text-support"
                    aria-hidden="true"
                  />
                </div>
              </Field>
              <button className="btn-primary mb-2">
                <span className="font-semibold text-sm md:text-base">
                  Добавить
                </span>
              </button>
            </form>
          </DisclosurePanel>
        </Disclosure>
      </div>
    </div>
  ) : (
    <div className="center-col min-h-[70vh]">
      <h2>У Вас нету прав для просмотра этой страницы</h2>
    </div>
  );
}
