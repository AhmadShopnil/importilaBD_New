import Image from "next/image";
import Container from "@/components/Container";
import Link from "next/link";

const Combos = ({ combos }) => {
  if (!combos || combos.length === 0) return null;

  return (
    <section id="combos" className="py-6 md:py-10 bg-gray-50/50 border-y border-gray-100">
      <Container>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-bold text-[#1C546D]">
            Combo Offers
          </h2>

          <Link
            href="/combo"
            className="text-xs md:text-sm font-medium text-[#1C546D] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {combos.map((combo) => {
            const hasDiscount = combo.offerPrice && combo.offerPrice < combo.price;

            return (
              <div
                key={combo._id}
                className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                {/* Image */}
                <Link
                  href={`/combo/kids/${combo.slug}`}
                  className="relative block w-full aspect-square overflow-hidden bg-gray-100"
                >
                  <Image
                    src={combo.featuredImage || "/placeholder.svg"}
                    alt={combo.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover hover:scale-102 transition-transform duration-300"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-[#1C546D] text-white text-[10px] font-medium px-2 py-0.5 rounded-sm">
                      SAVE ৳{combo.price - combo.offerPrice}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <Link href={`/combo/kids/${combo.slug}`}>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-1 hover:text-[#1C546D] transition-colors">
                        {combo.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-sm sm:text-base font-bold text-[#1C546D]">
                        ৳{combo.offerPrice || combo.price}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          ৳{combo.price}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/combo/kids/${combo.slug}`}
                    className="w-full py-2 bg-[#1C546D] hover:bg-[#164458] text-white text-xs sm:text-sm font-medium rounded-md text-center transition-colors block"
                  >
                    View Combo
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default Combos;
