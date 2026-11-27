"use client";

import Image from "next/image";

const SizeChart = ({ sizeChart }) => {
  if (!sizeChart || typeof sizeChart !== "string" || !sizeChart.trim()) {
    return null;
  }

  return (
    <section id="combo-size-chart" className="flex justify-center px-4 py-6 md:py-10 bg-white">
      <div className="w-full max-w-4xl">
        <h3 className="text-base sm:text-lg font-bold text-center text-[#1C546D] mb-4">
          Size Measurement Guide
        </h3>
        <div className="relative w-full aspect-[2/1] rounded-md overflow-hidden border border-gray-200 bg-gray-50 shadow-xs">
          <Image
            src={sizeChart}
            alt="Combo Size Measurement Chart"
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 900px"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default SizeChart;
