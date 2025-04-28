import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="bg-primary flex flex-col items-center justify-center gap-4 text-white h-screen w-full">
      <div className="text-4xl font-extrabold font-mono">404</div>
      <p className="text-white">
        Страница, которую Вы искали, нет. Вы можете перейти на
        <Link className="underline pl-2" href="/home">
          главную страницу.
        </Link>
      </p>
    </div>
  );
}
