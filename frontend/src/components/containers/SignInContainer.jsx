"use client";
import Link from "next/link";
import Image from "next/image";
import { apiUrl } from "../utils/utils";
import { SuccessToast, ErrorToast } from "../utils/utils";
import { newAction } from "../utils/ActionLogs";
import { useAdminStore } from "../utils/useAdminStore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { UserRound, Eye, EyeOff } from "lucide-react";

export default function SignInContainer() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const { setAdmin } = useAdminStore();
  const router = useRouter();

  const signInRequest = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (response.ok) {
        const successResponse = await response.json();
        setAdmin(successResponse);

        newAction(
          successResponse?.user?.Role,
          successResponse?.user?.username,
          "Вошел в систему",
          "LOGIN"
        );

        setTimeout(() => {
          SuccessToast({ successText: "Вы успешно вошли в аккаунт." });
          router.push("/home");
        }, 1750);
      } else {
        const errorResponse = await response.json();
        ErrorToast({
          errorText: errorResponse.message,
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await signInRequest(data.username, data.password);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="bg-support dark:bg-dark rounded flex flex-col md:flex-row items-center mb-16 md:mb-0 p-4 h-fit w-auto">
      <Image
        src="/logo.png"
        alt="logo of euro cosmetics"
        width={200}
        height={200}
        quality={100}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="center-col gap-1 w-full"
      >
        <div className="center-row relative w-full">
          <span className="rounded-l center-col absolute left-0 h-12 w-10">
            <UserRound className="text-dark dark:text-support h-5" />
          </span>
          <input
            type="text"
            className="input-primary dark:text-support pl-10 pr-4"
            defaultValue=""
            placeholder="Имя пользователя"
            {...register("username", { required: true })}
          />
        </div>
        <div className="center-row relative w-full">
          <span
            className="rounded-l center-col absolute left-0 h-12 w-10 cursor-pointer"
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
            className="input-primary dark:text-support pl-10 pr-4"
            placeholder="Пароль"
            {...register("password", { required: true })}
          />
        </div>
        <button
          disabled={isLoading}
          type="submit"
          className="btn-primary disabled:animate-pulse w-full"
        >
          Войти
        </button>
        <Link href="/privacy" className="underline italic text-xs mt-2">
          Политика конфиденциальности
        </Link>
      </form>
    </div>
  );
}
