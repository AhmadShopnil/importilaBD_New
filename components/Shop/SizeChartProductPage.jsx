"use client";

import Image from "next/image";
import Container from "../Container";

const SizeChartProductPage = ({ sizeChart }) => {
    // Only display if a size chart URL is explicitly provided for this product
    if (!sizeChart || typeof sizeChart !== "string" || !sizeChart.trim()) {
        return null;
    }

    return (
        <section id="size-chart-section" className="border-t border-border/50 bg-slate-50/50">
            <Container className="flex flex-col items-center justify-center py-6 md:py-10">
                <div className="w-full max-w-4xl">
                    <h3 className="text-xl md:text-2xl font-black text-center mb-4 text-[#1C546D]">
                        Size Measurement Guide
                    </h3>
                    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-border bg-white shadow-sm">
                        <Image
                            src={sizeChart}
                            alt="Product Size Chart"
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1000px"
                            priority
                        />
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default SizeChartProductPage;
