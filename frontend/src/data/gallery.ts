// Real photos from Amigo's Cafe (@amigos_trinco), stored in frontend/public/gallery.
// Food, drinks and coffee-bar details only — no customers. Replace or add photos any time.

export interface Shot { src: string; alt: string; caption: string }

export const SHOTS: Record<string, Shot> = {
  latteArt: { src: 'gallery/latte-art.webp', alt: 'A latte with rosetta latte art in a black cup on a dark saucer', caption: 'Latte art, every time' },
  coffeeBar: { src: 'gallery/coffee-bar-drink.webp', alt: 'An iced drink with lime, mint and star fruit on the espresso machine', caption: 'At the coffee bar' },
  icedLatte: { src: 'gallery/iced-latte.webp', alt: 'An iced latte on a woven coaster on a wooden table', caption: 'Iced latte, slow afternoon' },
  sandwichTable: { src: 'gallery/sandwich-table.webp', alt: 'A toasted sandwich with chips and a dip beside a small plant', caption: 'Sandwiches with chips' },
  barDrink: { src: 'gallery/bar-drink.webp', alt: 'A red cooler with mint and star fruit in front of the bar shelves', caption: 'Something cold from the bar' },
  fettuccine: { src: 'gallery/chicken-fettuccine.webp', alt: 'Close-up of grilled chicken on creamy fettuccine with parsley', caption: 'Creamy chicken pasta' },
  brownieServed: { src: 'gallery/brownie-served.webp', alt: 'A bowl of brownie with ice cream and mint being served', caption: 'Served warm' },
  caramelShake: { src: 'gallery/caramel-shake.webp', alt: 'A caramel shake with whipped cream and a chocolate bar', caption: 'Caramel drizzle' },
  chocoAvalanche: { src: 'gallery/choco-avalanche.webp', alt: 'A tall chocolate drink with chocolate drizzle and a cinnamon stick', caption: 'Choco Avalanche' },
  miloMocha: { src: 'gallery/milo-mocha.webp', alt: 'An iced Milo mocha topped with a chocolate bar', caption: 'Milo Mocha' },
  croissantSandwich: { src: 'gallery/croissant-sandwich.webp', alt: 'A croissant sandwich with cheese and salad on a woven placemat', caption: 'Croissant sandwich' },
  tuscanPasta: { src: 'gallery/tuscan-pasta.webp', alt: 'Creamy Tuscan chicken pasta in a white bowl', caption: 'Creamy Tuscan chicken pasta' },
  brownie: { src: 'gallery/brownie.webp', alt: 'Brownie with ice cream, nuts and mint in a bowl on a woven placemat', caption: 'Brownie Bliss' },
};
