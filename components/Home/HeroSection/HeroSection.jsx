"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import Container from "@/components/Container";
import Link from "next/link";

const HeroSection = ({ banners }) => {
  const displayBanners = banners?.length > 0 ? banners : [];

  if (displayBanners.length === 0) return null;

  return (
    <section className="py-3 md:py-6">
      <Container>
        <div className="w-full rounded-md overflow-hidden shadow-xs border border-gray-100">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            pagination={{ clickable: true }}
            loop={displayBanners.length > 1}
            className="w-full"
          >
            {displayBanners.map((slide, index) => (
              <SwiperSlide key={index}>
                <Link
                  href={slide?.link || "/shop"}
                  className={slide?.link ? "cursor-pointer" : "cursor-default"}
                >
                  <div className="relative w-full h-[180px] sm:h-[320px] md:h-[400px] lg:h-[480px]">
                    <Image
                      src={slide?.image}
                      alt={slide?.title || `Banner ${index + 1}`}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
