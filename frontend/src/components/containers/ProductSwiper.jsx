"use client";

import Image from "next/image";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";
import "../utils/swiper.css";

export default function ProductSwiper({ images }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  return (
    <div className="bg-white basic-border shadow shadow-support-200 p-2 w-full z-0">
      <Swiper
        loop={true}
        spaceBetween={10}
        navigation={true}
        thumbs={{
          swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
        }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="rounded h-56 w-full"
      >
        {images.map((file, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-full w-full">
              <Image
                src={URL.createObjectURL(file)}
                alt="image of product"
                className="rounded object-contain"
                sizes="100vw"
                fill
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
        className="thumbs rounded flex justify-between mt-2 h-14 w-full"
      >
        {images.map((file, index) => (
          <SwiperSlide key={index}>
            <button
              className="relative h-full w-full"
              onClick={(e) => e.preventDefault()}
            >
              <Image
                src={URL.createObjectURL(file)}
                alt="thumbnail of currently selected image"
                className="bg-white basic-border p-2 object-contain"
                sizes="100vw"
                fill
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
