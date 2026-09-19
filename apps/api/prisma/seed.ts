import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

/**
 * Demo credentials. Printed on every seed and documented in the README so a reviewer
 * can sign in within seconds of cloning.
 */
const DEMO_EMAIL = 'demo@shop.test';
const DEMO_PASSWORD = 'Password123!';

/** Prices are minor units (fils). AED 1,299.00 is 129900. */
type SeedVariant = { type: string; value: string; priceDelta: number; stock: number; sku: string };
type SeedProduct = {
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  category: string;
  stock: number;
  variants?: SeedVariant[];
};

/**
 * Fifteen products, as the brief specifies.
 *
 * Four carry multiple variants (the brief asks for at least three) and the stock
 * levels are deliberately uneven — several lines sit at zero and a few in low single
 * digits — so that out-of-stock, low-stock and quantity-clamping states are all
 * reachable from the seeded data without editing the database by hand.
 *
 * Images come from picsum.photos, seeded by slug so each product keeps the same
 * photo across reseeds. They are placeholders, not real product photography.
 */
const PRODUCTS: SeedProduct[] = [
  {
    slug: 'atlas-noise-cancelling-headphones',
    title: 'Atlas Noise-Cancelling Headphones',
    description:
      'Over-ear headphones with adaptive noise cancellation that samples the room forty times a second. Forty hours of playback, memory-foam earcups, and a folding aluminium frame that survives being thrown in a bag. USB-C fast charge gives five hours from a ten-minute top-up.',
    basePrice: 129900,
    category: 'Audio',
    stock: 0,
    variants: [
      { type: 'Color', value: 'Graphite', priceDelta: 0, stock: 14, sku: 'ATL-HP-GRA' },
      { type: 'Color', value: 'Sand', priceDelta: 0, stock: 6, sku: 'ATL-HP-SAN' },
      // Deliberately zero: proves the variant picker disables unavailable options.
      { type: 'Color', value: 'Midnight Navy', priceDelta: 5000, stock: 0, sku: 'ATL-HP-NAV' },
    ],
  },
  {
    slug: 'atlas-wireless-earbuds',
    title: 'Atlas Wireless Earbuds',
    description:
      'Compact in-ear buds with a stem-free profile and four microphones for call clarity. The case adds three full charges and sits flat enough to disappear into a pocket. Sweat and rain resistant to IPX5.',
    basePrice: 49900,
    category: 'Audio',
    stock: 42,
  },
  {
    slug: 'harbour-portable-speaker',
    title: 'Harbour Portable Speaker',
    description:
      'A palm-sized speaker with a passive radiator that pushes far more low end than its size suggests. Twelve hours of playback, floats in water, and pairs with a second unit for stereo.',
    basePrice: 34900,
    category: 'Audio',
    stock: 0,
  },
  {
    slug: 'meridian-fitness-watch',
    title: 'Meridian Fitness Watch',
    description:
      'Tracks heart rate, sleep stages and twenty-two workout types on a screen that stays readable in direct sun. Seven-day battery under normal use, and a titanium case that shrugs off gym knocks.',
    basePrice: 89900,
    category: 'Wearables',
    stock: 0,
    variants: [
      { type: 'Size', value: '38mm', priceDelta: 0, stock: 11, sku: 'MER-FW-38' },
      { type: 'Size', value: '42mm', priceDelta: 4000, stock: 3, sku: 'MER-FW-42' },
      { type: 'Size', value: '46mm', priceDelta: 8000, stock: 0, sku: 'MER-FW-46' },
    ],
  },
  {
    slug: 'trailhead-merino-runner',
    title: 'Trailhead Merino Runner',
    description:
      'A running shoe knitted from merino wool, which regulates temperature and resists odour far better than synthetics. Natural rubber outsole, castor-bean foam midsole, machine washable.',
    basePrice: 45900,
    category: 'Footwear',
    stock: 0,
    variants: [
      { type: 'Size', value: 'UK 7', priceDelta: 0, stock: 8, sku: 'TRA-MR-07' },
      { type: 'Size', value: 'UK 8', priceDelta: 0, stock: 15, sku: 'TRA-MR-08' },
      { type: 'Size', value: 'UK 9', priceDelta: 0, stock: 2, sku: 'TRA-MR-09' },
      { type: 'Size', value: 'UK 10', priceDelta: 0, stock: 0, sku: 'TRA-MR-10' },
      { type: 'Size', value: 'UK 11', priceDelta: 0, stock: 5, sku: 'TRA-MR-11' },
    ],
  },
  {
    slug: 'coastal-linen-overshirt',
    title: 'Coastal Linen Overshirt',
    description:
      'Cut from heavyweight European linen that softens with every wash. Worn open as a light jacket or buttoned as a shirt, with patch pockets deep enough to be useful and a relaxed shoulder.',
    basePrice: 32900,
    category: 'Apparel',
    stock: 0,
    variants: [
      { type: 'Size', value: 'S', priceDelta: 0, stock: 4, sku: 'COA-LO-S' },
      { type: 'Size', value: 'M', priceDelta: 0, stock: 12, sku: 'COA-LO-M' },
      { type: 'Size', value: 'L', priceDelta: 0, stock: 9, sku: 'COA-LO-L' },
      { type: 'Size', value: 'XL', priceDelta: 0, stock: 1, sku: 'COA-LO-XL' },
    ],
  },
  {
    slug: 'bramble-leather-card-holder',
    title: 'Bramble Leather Card Holder',
    description:
      'Four card slots and a centre pocket, cut from a single piece of vegetable-tanned leather and saddle-stitched by hand. Starts stiff, moulds to what you carry, and darkens over a few months.',
    basePrice: 14900,
    category: 'Accessories',
    // Low stock on purpose: the detail page should warn, and the stepper should cap at 3.
    stock: 3,
  },
  {
    slug: 'keystone-mechanical-keyboard',
    title: 'Keystone Mechanical Keyboard',
    description:
      'A 75% layout with hot-swappable switches, a gasket-mounted plate and double-shot PBT keycaps. Connects over USB-C or Bluetooth to three devices, with a knob that does volume until you tell it otherwise.',
    basePrice: 62900,
    category: 'Desk',
    stock: 18,
  },
  {
    slug: 'keystone-laptop-stand',
    title: 'Keystone Laptop Stand',
    description:
      'Milled from a single aluminium billet, so there is nothing to wobble. Raises a laptop to eye level and lets air move underneath, which keeps fans quiet during long builds.',
    basePrice: 21900,
    category: 'Desk',
    stock: 25,
  },
  {
    slug: 'kettle-ceramic-pour-over',
    title: 'Kettle Ceramic Pour-Over Set',
    description:
      'A stoneware dripper and matching carafe, glazed inside and out. The internal ribs hold the paper away from the wall so water drains evenly instead of channelling down one side.',
    basePrice: 18900,
    category: 'Home',
    stock: 12,
  },
  {
    slug: 'forge-cast-iron-skillet',
    title: 'Forge Cast Iron Skillet',
    description:
      'A 26cm skillet, pre-seasoned with flaxseed oil and ready to use. Holds heat long enough to sear properly, moves from hob to oven without ceremony, and outlives most kitchens.',
    basePrice: 27900,
    category: 'Home',
    stock: 7,
  },
  {
    slug: 'voyager-weekender-duffel',
    title: 'Voyager Weekender Duffel',
    description:
      'Forty litres of waxed canvas with a leather base that takes the abuse of being put down on wet ground. Fits a carry-on sizer, with a separate compartment for shoes.',
    basePrice: 39900,
    category: 'Bags',
    stock: 9,
  },
  {
    slug: 'voyager-canvas-backpack',
    title: 'Voyager Canvas Backpack',
    description:
      'A twenty-two litre daypack with a padded sixteen-inch laptop sleeve and a roll-top that expands when you need it. Cotton canvas outside, recycled ripstop lining inside.',
    basePrice: 29900,
    category: 'Bags',
    stock: 0,
  },
  {
    slug: 'lumen-desk-lamp',
    title: 'Lumen Desk Lamp',
    description:
      'A weighted-base task lamp with stepless dimming from candlelight to daylight, and a head that stays exactly where you put it. High colour rendering, so what you see on paper matches the screen.',
    basePrice: 24900,
    category: 'Home',
    stock: 2,
  },
  {
    slug: 'summit-insulated-bottle',
    title: 'Summit Insulated Bottle',
    description:
      'Double-walled stainless steel that holds cold for twenty-four hours and hot for twelve. Narrow enough for a cup holder, with a lid that takes one hand to open and genuinely does not leak.',
    basePrice: 9900,
    category: 'Accessories',
    stock: 60,
  },
];

const imageFor = (slug: string) => `https://picsum.photos/seed/${slug}/800/800`;

async function main(): Promise<void> {
  console.log('Seeding database…\n');

  // Idempotent: wipe transactional and catalogue data so reseeding is safe to repeat.
  // Order matters — children before parents.
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo Shopper',
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });

  for (const product of PRODUCTS) {
    const { variants, ...rest } = product;
    await prisma.product.create({
      data: {
        ...rest,
        imageUrl: imageFor(product.slug),
        ...(variants ? { variants: { create: variants } } : {}),
      },
    });
  }

  const variantCount = await prisma.variant.count();
  const multiVariantCount = PRODUCTS.filter((p) => (p.variants?.length ?? 0) > 1).length;

  console.log(`  ${PRODUCTS.length} products (${multiVariantCount} with multiple variants)`);
  console.log(`  ${variantCount} variants`);
  console.log(`  1 user: ${user.email}\n`);
  console.log('  Sign in with:');
  console.log(`    email:    ${DEMO_EMAIL}`);
  console.log(`    password: ${DEMO_PASSWORD}\n`);
  console.log('Done.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
