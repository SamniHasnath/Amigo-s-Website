// Picks the 3D model for a menu item from its name and section.
// New items added in the admin panel get a sensible model automatically.
import type { MenuItem } from '@/types';
import type { Dish } from './FoodModels';

const has = (s: string, ...w: string[]) => w.some((x) => s.includes(x));

const SHAKE: Record<string, string> = { vanilla: '#f1e3c4', chocolate: '#6b3b22', strawberry: '#f2a1b5', banana: '#f3e08a', mango: '#f6b23c', caramel: '#c98d4e', hazelnut: '#a8754a' };
const flavour = (n: string) => Object.keys(SHAKE).find((k) => n.includes(k));

export function dishFor(item: Pick<MenuItem, 'name' | 'section'> & { category?: { slug: string } }): Dish {
  const n = item.name.toLowerCase();
  const s = item.section.toLowerCase();
  const cat = item.category?.slug ?? '';

  // coffee
  if (n.includes('affogato')) return { kind: 'affogato' };
  if (n.includes('sparkling')) return { kind: 'glass', style: 'sparkling', liquid: '#e9e3d2', garnish: 'orange' };
  if (has(n, 'espresso', 'doppio')) return { kind: 'cup', top: 'crema', small: true };
  if (n.includes('americano')) return { kind: 'cup', top: 'americano' };
  if (n.includes('cappuccino')) return { kind: 'cup', top: 'cappuccino' };
  if (n.includes('hot chocolate')) return { kind: 'cup', top: 'choc' };
  if (n.includes('spanish')) return { kind: 'cup', top: 'spanish' };
  if (has(n, 'latte', 'flat white', 'brew', 'mocha')) return { kind: 'cup', top: 'latte' };

  // cold drinks
  if (s.includes('frappe') || n.includes('frappe')) {
    const f = flavour(n) ?? 'vanilla';
    return { kind: 'glass', style: 'shake', liquid: SHAKE[f], drizzle: f === 'vanilla' ? '#6b3b22' : f === 'caramel' ? '#b8722e' : '#5a2e14' };
  }
  if (s.includes('milkshake') || n.includes('shake')) {
    const f = flavour(n) ?? 'vanilla';
    const garnish = f === 'strawberry' ? 'strawberry' : f === 'banana' ? 'banana' : 'none';
    return { kind: 'glass', style: 'shake', liquid: SHAKE[f], garnish, drizzle: f === 'chocolate' ? '#3a1a0c' : undefined };
  }
  if (s.includes('lemonade') || n.includes('lemonade')) {
    if (n.includes('mango')) return { kind: 'glass', style: 'tall', liquid: '#f6b23c', garnish: 'lime' };
    if (n.includes('passion')) return { kind: 'glass', style: 'tall', liquid: '#f0c040', garnish: 'orange' };
    if (n.includes('blue')) return { kind: 'glass', style: 'tall', liquid: '#4fb6e0', garnish: 'mint' };
    if (n.includes('strawberry')) return { kind: 'glass', style: 'tall', liquid: '#ef6f8a', garnish: 'strawberry' };
    return { kind: 'glass', style: 'tall', liquid: '#dcefb4', garnish: 'mint' };
  }
  if (has(s, 'smoothie', 'juice') || has(n, 'smoothie', 'juice')) {
    if (n.includes('watermelon')) return { kind: 'glass', style: 'tall', liquid: '#ef5a6f', garnish: 'watermelon' };
    if (n.includes('papaya')) return { kind: 'glass', style: 'smoothie', liquid: '#f39a4a', garnish: 'orange' };
    if (n.includes('pineapple')) return { kind: 'glass', style: 'tall', liquid: '#f7d351', garnish: 'pineapple' };
    if (n.includes('banana')) return { kind: 'glass', style: 'smoothie', liquid: '#f3e3a0', garnish: 'banana' };
    return { kind: 'glass', style: 'smoothie', liquid: '#f6a82a', garnish: 'orange' };
  }

  // pastries
  if (n.includes('cinnamon')) return { kind: 'cinnamon' };
  if (n.includes('nutella')) return { kind: 'cinnamon', choc: true };
  if (n.includes('pain au') || n.includes('chocolat')) return { kind: 'painchoc' };
  if (n.includes('croissant')) return { kind: 'croissant' };

  // mains
  if (n.includes('shakshuka')) return { kind: 'shakshuka' };
  if (s.includes('pasta') || n.includes('pasta')) return { kind: 'pasta', topping: n.includes('prawn') ? 'prawn' : n.includes('bacon') ? 'bacon' : 'chicken' };
  if (s.includes('loaded') || (n.includes('fries') && cat === 'mains'))
    return { kind: 'fries', topping: n.includes('prawn') ? 'prawn' : n.includes('cheese') ? 'cheese' : 'chicken' };
  if (n.includes('panini')) return { kind: 'panini', veg: n.includes('veg') };
  if (has(n, 'tortilla', 'wrap')) return { kind: 'wrap', filling: n.includes('tuna') ? 'tuna' : n.includes('crispy') ? 'crispy' : 'devilled' };
  if (n.includes('burger')) return { kind: 'burger', patty: n.includes('mushroom') ? 'mushroom' : 'chicken' };
  if (n.includes('sandwich')) return { kind: 'sandwich', filling: n.includes('tuna') ? 'tuna' : 'chicken' };

  // add-ons
  if (n.includes('syrup')) return { kind: 'syrup', color: n.includes('caramel') ? '#c07a2e' : n.includes('hazelnut') ? '#8a5228' : '#ead9a8' };
  if (n.includes('drizzle')) return { kind: 'sauce', color: n.includes('white') ? '#f6efe0' : n.includes('caramel') ? '#c07a2e' : '#3a1a0c' };
  if (n.includes('biscoff')) return { kind: 'cookies', biscoff: true };
  if (n.includes('cookie')) return { kind: 'cookies' };
  if (n.includes('bar')) return { kind: 'bars', color: n.includes('peanut') ? '#c9924e' : '#b8722e' };
  if (n.includes('egg')) return { kind: 'egg' };
  if (n.includes('pickle')) return { kind: 'pickle' };
  if (n.includes('bread')) return { kind: 'bread' };
  if (n.includes('cheese')) return { kind: 'cheese' };
  if (n.includes('fries') || n.includes('fires')) return { kind: 'fries' };

  // fallbacks by category
  if (cat === 'coffee') return { kind: 'cup', top: 'latte' };
  if (cat === 'frappes-shakes') return { kind: 'glass', style: 'shake', liquid: '#f1e3c4' };
  if (cat === 'juices-lemonades') return { kind: 'glass', style: 'tall', liquid: '#f6b23c', garnish: 'orange' };
  if (cat === 'pastries') return { kind: 'croissant' };
  if (cat === 'burgers-sandwiches') return { kind: 'burger', patty: 'chicken' };
  if (cat === 'panini-wraps') return { kind: 'panini' };
  if (cat === 'mains') return { kind: 'pasta', topping: 'chicken' };
  return { kind: 'sauce', color: '#c07a2e' };
}
