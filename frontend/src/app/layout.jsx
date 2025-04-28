import "./globals.css";
import TopProgressBar from "@/components/nav/TopProgressBar";

export const metadata = {
  title: "EuroCosmetics Admin Panel by Älem Tilsimat",
  description: "EuroCosmetics Admin Panel by Älem Tilsimat",
  name: "viewport",
  content: "width=device-width, initial-scale=1",
};

import { Open_Sans } from "next/font/google";

const globalFont = Open_Sans({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["300", "400", "500", "700", "800"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={globalFont.globalFont} suppressHydrationWarning>
      <body className="bg-white dark:bg-dark flex flex-col min-h-screen">
        <TopProgressBar />
        {children}
      </body>
    </html>
  );
}
