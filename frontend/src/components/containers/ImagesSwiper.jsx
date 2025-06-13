"use client";

import { apiUrl } from "../utils/utils";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "../utils/swiper.css";

export default function ImagesSwiper({ images }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  return (
    <div className="bg-white basic-border shadow shadow-support-200 p-2 w-full z-0">
      <>
        <Swiper
          loop={true}
          spaceBetween={10}
          navigation={true}
          thumbs={{
            swiper:
              thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="rounded h-56 w-full"
        >
          {images?.map((file, index) => (
            <SwiperSlide key={index}>
              <div className="flex items-center justify-center relative h-full w-full">
                <img
                  src={apiUrl + "/" + file}
                  alt="image of product"
                  className="rounded object-contain h-56"
                  crossOrigin="anonymous"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <Swiper
          onSwiper={setThumbsSwiper}
          loop={true}
          spaceBetween={12}
          slidesPerView={5}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumbs rounded flex justify-between h-14 w-full"
        >
          {images?.map((file, index) => (
            <SwiperSlide key={index}>
              <button
                className="relative h-14 w-20"
                onClick={(e) => e.preventDefault()}
              >
                <img
                  src={apiUrl + "/" + file}
                  alt="thumbnail of currently selected image"
                  className="bg-white border border-grey-200 rounded p-2 object-contain h-full w-full"
                  crossOrigin="anonymous"
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>
      </>
    </div>
  );
}
