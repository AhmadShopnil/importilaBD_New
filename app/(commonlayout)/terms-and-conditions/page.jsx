import { getStoreSettings } from "@/lib/dataService";

export default async function TermsAndConditionsPage() {
  const settings = await getStoreSettings();
  const content = settings?.termsAndConditions || "";

  return (
    <section className="bg-background min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 md:p-12 overflow-hidden">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 md:mb-10 text-center border-b border-gray-100 pb-4 md:pb-6">
            Terms and Conditions
          </h1>

          {content ? (
            <div
              className="rich-text-content space-y-4 text-foreground/90 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-center py-10">
              {content === null ? (
                <p className="text-red-500 text-lg">Failed to load content. Please try again later.</p>
              ) : (
                <p className="text-muted-foreground text-lg">Terms and conditions are yet to be updated.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
