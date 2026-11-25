import type { Category, MenuItem } from '@/types';

// Amigo's Cafe menu, as provided by the business on its Google listing.
// The backend seeds the same data (backend/prisma/seed.ts).

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Coffee', slug: 'coffee', sortOrder: 1 },
  { id: 2, name: 'Frappes & Shakes', slug: 'frappes-shakes', sortOrder: 2 },
  { id: 3, name: 'Juices & Lemonades', slug: 'juices-lemonades', sortOrder: 3 },
  { id: 4, name: 'Pastries', slug: 'pastries', sortOrder: 4 },
  { id: 5, name: 'Mains', slug: 'mains', sortOrder: 5 },
  { id: 6, name: 'Panini & Wraps', slug: 'panini-wraps', sortOrder: 6 },
  { id: 7, name: 'Burgers & Sandwiches', slug: 'burgers-sandwiches', sortOrder: 7 },
  { id: 8, name: 'Add-ons', slug: 'add-ons', sortOrder: 8 },
];

type Row = [slug: string, section: string, name: string, price: number, description?: string, popular?: boolean];

const ROWS: Row[] = [
  ['coffee', 'Coffee & Hot Chocolate', 'Espresso', 650, 'Freshly pulled single shot of rich, full-bodied espresso with a thick golden crema.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Doppio', 750, 'Double shot of pure espresso for a bold, aromatic caffeine kick.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Americano', 700, 'Rich double espresso softened with hot water for a clean, deep roast flavor.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Latte', 800, 'Fresh espresso gently folded with velvety steamed milk, poured with signature latte art.', true],
  ['coffee', 'Coffee & Hot Chocolate', 'Cappuccino', 800, 'Balanced espresso and steamed milk beneath a dense, fluffy cloud of foam and cocoa dusting.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Flat White', 900, 'Double shot with smooth, fine microfoam for coffee lovers who prefer a bolder cup.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Bumble Brew', 1300, 'Chilled fresh orange juice topped with a floating espresso shot — bold, citrusy, and refreshing.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Sparkling Espresso', 1100, 'Effervescent soda poured over ice and espresso with a twist of fresh citrus.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Affogato', 1000, 'A generous scoop of vanilla ice cream drowned in a freshly pulled piping-hot espresso shot.', true],
  ['coffee', 'Coffee & Hot Chocolate', 'Hot Chocolate', 1200, 'Thick Dutch cocoa steamed with whole milk and topped with creamy froth.'],
  ['coffee', 'Coffee & Hot Chocolate', 'Spanish Latte', 1200, 'A smooth, velvety espresso latte sweetened with silky condensed milk.', true],

  ['frappes-shakes', 'Coffee-Based Frappes', 'Vanilla Frappe', 1400, 'Ice-blended espresso and sweet vanilla cream, topped with cold whipped cream.'],
  ['frappes-shakes', 'Coffee-Based Frappes', 'Caramel Frappe', 1600, 'Blended chilled espresso with buttery caramel syrup, whipped cream, and caramel swirl.', true],
  ['frappes-shakes', 'Coffee-Based Frappes', 'Hazelnut Frappe', 1800, 'Aromatic toasted hazelnut syrup blended with espresso, cold milk, and crushed ice.'],
  ['frappes-shakes', 'Milkshakes', 'Vanilla Milkshake', 1100, 'Old-fashioned creamy milkshake churned with rich vanilla bean cream and cold milk.'],
  ['frappes-shakes', 'Milkshakes', 'Chocolate Milkshake', 1200, 'Thick, frosty chocolate shake with Dutch cocoa, chocolate syrup, and a chocolate bar garnish.', true],
  ['frappes-shakes', 'Milkshakes', 'Strawberry Milkshake', 1200, 'Creamy, nostalgic milkshake blended with sweet real strawberry fruit purée.'],
  ['frappes-shakes', 'Milkshakes', 'Banana Milkshake', 1200, 'Sweet ripe local bananas whipped into a chilled, satisfying milk shake.'],
  ['frappes-shakes', 'Milkshakes', 'Mango Milkshake', 1300, 'Golden tropical Sri Lankan mangoes blended into a luscious, sunshine-bright shake.'],

  ['juices-lemonades', 'Lemonades', 'Lime Lemonade', 600, 'Freshly squeezed Sri Lankan lime juice, crushed garden mint, and chilled soda over ice.', true],
  ['juices-lemonades', 'Lemonades', 'Mango Lemonade', 800, 'Sweet tropical mango purée shaken with tart lime juice and sparkling soda.'],
  ['juices-lemonades', 'Lemonades', 'Passion Lemonade', 800, 'Fragrant island passion fruit pulp shaken with tart lime, mint, and ice-cold water.', true],
  ['juices-lemonades', 'Lemonades', 'Blue Mint Lemonade', 800, 'Vibrant citrus cooler with bruised fresh mint leaves, lime, and chilled sparkling soda.'],
  ['juices-lemonades', 'Lemonades', 'Strawberry Lemonade', 900, 'Crushed sweet strawberries shaken with fresh lime juice and served frosty cold.'],
  ['juices-lemonades', 'Smoothies & Fresh Juices', 'Banana Smoothie', 600, 'Thick, nourishing blend of fresh bananas, wild honey, and chilled milk.'],
  ['juices-lemonades', 'Smoothies & Fresh Juices', 'Watermelon Juice', 600, 'Fresh sweet watermelon pressed to order with crushed ice — pure hydration after the beach.'],
  ['juices-lemonades', 'Smoothies & Fresh Juices', 'Papaya Juice', 700, 'Sun-ripened local red papaya blended cold with a splash of fresh lime.'],
  ['juices-lemonades', 'Smoothies & Fresh Juices', 'Mango Smoothie', 800, 'Thick, frosty blend of fresh seasonal mangoes — naturally sweet and velvety.', true],
  ['juices-lemonades', 'Smoothies & Fresh Juices', 'Pineapple Juice', 900, 'Freshly crushed sweet tropical pineapple juice served ice-cold.'],

  ['pastries', 'Pastries & Sweet Treats', 'Cinnamon Rolls', 500, 'Soft oven-baked spiral pastry generously swirled with Ceylon cinnamon and sweet glaze.'],
  ['pastries', 'Pastries & Sweet Treats', 'Croissants', 700, 'Buttery, golden French-style croissant with crisp flaky layers and an airy center.', true],
  ['pastries', 'Pastries & Sweet Treats', 'Nutella Rolls', 700, 'Warm baked spiral pastry filled to the brim with rich, melted Nutella hazelnut chocolate.'],
  ['pastries', 'Pastries & Sweet Treats', 'Pain Au Chocolat', 750, 'Golden flaky puff pastry wrapped around two sticks of melted dark chocolate.', true],

  ['mains', 'Pasta with Creamy Sauce', 'Chicken Creamy Pasta', 1300, 'Al dente pasta tossed in a velvety garlic-parmesan cream sauce with seasoned tender chicken.', true],
  ['mains', 'Pasta with Creamy Sauce', 'Prawn Creamy Pasta', 1300, 'Pan-seared coastal prawns in a luscious Italian cream sauce with herbs and cracked black pepper.'],
  ['mains', 'Pasta with Creamy Sauce', 'Bacon Creamy Pasta', 1200, 'Smoky crispy bacon tossed through a silky garlic cream sauce, finished with fresh parsley.'],
  ['mains', 'Shakshuka', 'Mozzarella Shakshuka', 2000, 'Slow-simmered spiced tomatoes, peppers, and mushrooms with poached eggs, melted mozzarella, and garlic bread.', true],
  ['mains', 'Loaded Fries', 'Chicken Loaded Fries', 1200, 'Crispy golden fries piled high with spiced chicken, melted cheese sauce, and house dressing.', true],
  ['mains', 'Loaded Fries', 'Cheese Balls Loaded Fries', 1200, 'Crisp fries loaded with gooey fried cheese balls, herb mayo, and melted cheese.'],
  ['mains', 'Loaded Fries', 'Prawn Loaded Fries', 1300, 'Golden seasoned fries topped with tender pan-fried prawns and creamy garlic sauce.'],

  ['panini-wraps', 'Panini', 'Pesto Chicken Panini', 1850, 'Grilled chicken, aromatic basil pesto, ripe tomato, and melted mozzarella pressed in crusty ciabatta.', true],
  ['panini-wraps', 'Panini', 'Grilled Veggie Pesto Panini', 1350, 'Roasted eggplant, tender zucchini, basil pesto, and molten mozzarella in toasted ciabatta.'],
  ['panini-wraps', 'Tortilla Wraps', 'Devilled Chicken Tortilla', 2000, 'Sri Lankan spicy devilled chicken with fresh capsicum, melted cheese, and spicy garlic mayo.', true],
  ['panini-wraps', 'Tortilla Wraps', 'Crispy Chicken Tortilla', 2100, 'Golden crispy chicken strips with crunchy shredded slaw, melted cheese, and house sauce.', true],
  ['panini-wraps', 'Tortilla Wraps', 'Devilled Tuna Tortilla', 2000, 'Locally caught spiced devilled tuna with sautéed onions, peppers, and melted cheese in a toasted wrap.'],

  ['burgers-sandwiches', 'Burgers', 'Crispy Chicken Burger', 1400, 'Crunchy seasoned chicken fillet in a toasted brioche bun with fresh lettuce, tomato, and house burger sauce.', true],
  ['burgers-sandwiches', 'Burgers', 'Crispy Mushroom Burger', 1300, 'Panko-crusted whole mushrooms stacked with creamy coleslaw and spiced mayo in toasted brioche.'],
  ['burgers-sandwiches', 'Sandwiches', 'Devilled Chicken Sandwich', 1600, 'Toasted artisan bread packed with spicy devilled chicken, melted cheese, and crisp greens.'],
  ['burgers-sandwiches', 'Sandwiches', 'Devilled Tuna Sandwich', 1400, 'Spiced devilled tuna with melted cheese and fresh tomatoes pressed between toasted country bread.'],

  ['add-ons', 'Syrups & Drizzles', 'Vanilla Syrup', 150, 'Pure fragrant Madagascar vanilla syrup.'],
  ['add-ons', 'Syrups & Drizzles', 'Caramel Syrup', 150, 'Smooth buttery caramel syrup.'],
  ['add-ons', 'Syrups & Drizzles', 'Hazelnut Syrup', 150, 'Toasted aromatic hazelnut syrup.'],
  ['add-ons', 'Syrups & Drizzles', 'Chocolate Drizzle', 150, 'Rich dark chocolate sauce drizzle.'],
  ['add-ons', 'Syrups & Drizzles', 'Caramel Drizzle', 150, 'Warm golden caramel sauce swirl.'],
  ['add-ons', 'Syrups & Drizzles', 'White Chocolate Drizzle', 150, 'Velvety sweet white chocolate drizzle.'],
  ['add-ons', 'Toppings', 'Cookies', 150, 'Crumbled chocolate chip cookies.'],
  ['add-ons', 'Toppings', 'Peanut Bar', 200, 'Crunchy caramelized peanut brittle bar.'],
  ['add-ons', 'Toppings', 'Caramel Bar', 200, 'Chewy layered caramel chocolate bar.'],
  ['add-ons', 'Toppings', 'Biscoff', 300, 'Spiced Lotus Biscoff biscuit and spread.'],
  ['add-ons', 'Extras', 'Egg', 150, 'Fried or poached farm egg.'],
  ['add-ons', 'Extras', 'Pickle', 150, 'House tangy pickled cucumber slices.'],
  ['add-ons', 'Extras', 'Bread', 150, 'Toasted garlic country bread slices.'],
  ['add-ons', 'Extras', 'Cheese', 200, 'Extra slice of melted mozzarella or cheddar.'],
  ['add-ons', 'Extras', 'French Fries', 200, 'Side portion of hot, salted golden fries.'],
];

/** Real photos for every dish and drink on the Amigo's menu. */
export const PHOTOS: Record<string, string> = {
  // Coffee & Hot Chocolate
  'Espresso': 'menu/espresso.webp',
  'Doppio': 'menu/doppio.webp',
  'Americano': 'menu/americano.webp',
  'Latte': 'menu/latte.webp',
  'Cappuccino': 'menu/cappuccino.webp',
  'Flat White': 'menu/flat-white.webp',
  'Bumble Brew': 'menu/bumble-brew.webp',
  'Sparkling Espresso': 'menu/sparkling-espresso.webp',
  'Affogato': 'menu/affogato.webp',
  'Hot Chocolate': 'menu/hot-chocolate.webp',
  'Spanish Latte': 'menu/spanish-latte.webp',

  // Frappes & Shakes
  'Vanilla Frappe': 'menu/frappe.webp',
  'Caramel Frappe': 'gallery/caramel-shake.webp',
  'Hazelnut Frappe': 'menu/frappe.webp',
  'Vanilla Milkshake': 'menu/vanilla-milkshake.webp',
  'Chocolate Milkshake': 'gallery/choco-avalanche.webp',
  'Strawberry Milkshake': 'menu/strawberry-milkshake.webp',
  'Banana Milkshake': 'menu/banana-milkshake.webp',
  'Mango Milkshake': 'menu/mango-milkshake.webp',

  // Juices & Lemonades
  'Lime Lemonade': 'gallery/bar-drink.webp',
  'Mango Lemonade': 'menu/mango-lemonade.webp',
  'Passion Lemonade': 'gallery/coffee-bar-drink.webp',
  'Blue Mint Lemonade': 'menu/blue-mint-lemonade.webp',
  'Strawberry Lemonade': 'menu/strawberry-lemonade.webp',
  'Banana Smoothie': 'menu/banana-smoothie.webp',
  'Watermelon Juice': 'menu/watermelon-juice.webp',
  'Papaya Juice': 'menu/papaya-juice.webp',
  'Mango Smoothie': 'menu/mango-smoothie.webp',
  'Pineapple Juice': 'menu/pineapple-juice.webp',

  // Pastries & Sweet Treats
  'Cinnamon Rolls': 'menu/cinnamon-rolls.webp',
  'Croissants': 'gallery/croissant-sandwich.webp',
  'Nutella Rolls': 'menu/nutella-rolls.webp',
  'Pain Au Chocolat': 'gallery/brownie.webp',

  // Mains
  'Chicken Creamy Pasta': 'menu/chicken-creamy-pasta.webp',
  'Prawn Creamy Pasta': 'gallery/tuscan-pasta.webp',
  'Bacon Creamy Pasta': 'gallery/chicken-fettuccine.webp',
  'Mozzarella Shakshuka': 'menu/shakshuka.webp',
  'Chicken Loaded Fries': 'menu/chicken-loaded-fries.webp',
  'Cheese Balls Loaded Fries': 'menu/cheese-balls-fries.webp',
  'Prawn Loaded Fries': 'menu/prawn-loaded-fries.webp',

  // Panini & Wraps
  'Pesto Chicken Panini': 'menu/pesto-chicken-panini.webp',
  'Grilled Veggie Pesto Panini': 'menu/veggie-pesto-panini.webp',
  'Devilled Chicken Tortilla': 'menu/tortilla-wraps.webp',
  'Crispy Chicken Tortilla': 'menu/tortilla-wraps.webp',
  'Devilled Tuna Tortilla': 'menu/tortilla-wraps.webp',

  // Burgers & Sandwiches
  'Crispy Chicken Burger': 'menu/crispy-chicken-burger.webp',
  'Crispy Mushroom Burger': 'menu/crispy-mushroom-burger.webp',
  'Devilled Chicken Sandwich': 'menu/devilled-sandwiches.webp',
  'Devilled Tuna Sandwich': 'gallery/sandwich-table.webp',

  // Add-ons
  'Vanilla Syrup': 'menu/vanilla-syrup.webp',
  'Caramel Syrup': 'menu/caramel-syrup.webp',
  'Hazelnut Syrup': 'menu/hazelnut-syrup.webp',
  'Chocolate Drizzle': 'menu/chocolate-drizzle.webp',
  'Caramel Drizzle': 'menu/caramel-drizzle.webp',
  'White Chocolate Drizzle': 'menu/white-choco-drizzle.webp',
  'Cookies': 'menu/cookies.webp',
  'Peanut Bar': 'menu/peanut-bar.webp',
  'Caramel Bar': 'menu/caramel-bar.webp',
  'Biscoff': 'menu/biscoff.webp',
  'Egg': 'menu/egg.webp',
  'Pickle': 'menu/pickle.webp',
  'Bread': 'menu/bread.webp',
  'Cheese': 'menu/cheese.webp',
  'French Fries': 'menu/french-fries.webp',
};

export const SEED_MENU: MenuItem[] = ROWS.map(([slug, section, name, price, description, popular], i) => {
  const category = CATEGORIES.find((c) => c.slug === slug)!;
  return {
    id: i + 1,
    name,
    description: description ?? '',
    price,
    section,
    categoryId: category.id,
    category,
    isPopular: !!popular,
    isAvailable: true,
    sortOrder: i + 1,
    imageUrl: PHOTOS[name] ?? null,
  };
});
