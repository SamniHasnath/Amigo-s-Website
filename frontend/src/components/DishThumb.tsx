import { imageSrc } from '@/lib/api';
import type { MenuItem } from '@/types';
import FoodArt from './FoodArt';

/** Real photo when the item has one, otherwise the drawn icon. */
export default function DishThumb({ item, className = 'h-16 w-16' }: { item: Pick<MenuItem, 'name' | 'imageUrl'> & { category?: { slug: string } }; className?: string }) {
  if (item.imageUrl) return <img src={imageSrc(item.imageUrl)} alt={item.name} loading="lazy" className={`${className} object-contain drop-shadow-xl`} />;
  return <FoodArt slug={item.category?.slug ?? ''} className={className} />;
}
