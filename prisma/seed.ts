import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Fetch clothing products from a free public API
  const response = await fetch("https://fakestoreapi.com/products/category/men's clothing");
  const externalProducts = await response.json();

  const response2 = await fetch("https://fakestoreapi.com/products/category/women's clothing");
  const externalProducts2 = await response2.json();

  const allExternal = [...externalProducts, ...externalProducts2];

  for (const item of allExternal) {
    await prisma.product.create({
      data: {
        name: item.title,
        description: item.description,
        price: Math.round(item.price * 80), // rough USD→INR conversion, adjust as you like
        category: item.category.includes("men's") ? "men" : "women",
        sizes: ["S", "M", "L", "XL"], // FakeStoreAPI doesn't provide sizes, so we add defaults
        stock: 50,
        imageUrls: [item.image],
      },
    });
  }

  console.log(`Seeded ${allExternal.length} products from FakeStoreAPI`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());