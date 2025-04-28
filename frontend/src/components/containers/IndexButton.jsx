import Link from "next/link";

export default function IndexButton({ url, icon, title }) {
  return (
    <Link href={url} className="index-button">
      <div>{icon}</div>
      <h3>{title}</h3>
    </Link>
  );
}
