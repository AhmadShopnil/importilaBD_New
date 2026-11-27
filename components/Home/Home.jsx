import Combos from './ComboSection/Combos';
import HeroSection from './HeroSection/HeroSection';
import ProductsList from './ProductList/ProductList';
import { getCombos, getProducts, getSliders } from '../../utils/apiActions';

export default async function Home() {
  const banners = (await getSliders("hero_home")) || [];
  const products = await getProducts();
  const combos = await getCombos();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection banners={banners} />
      
      <ProductsList products={products} />
      <Combos combos={combos} />
    </div>
  );
}
