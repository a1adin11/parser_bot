import fs from "node:fs/promises";

export const getUserInput = (ctx) => ctx?.update?.message?.text;

export const createDocument = async (searchArray, outputPath) => {
  console.log("Original searchArray for processing:", searchArray);

  const newArray = searchArray.map((item) => ({
    name: item.name,
    brand: item.brand,
    seller: item.supplier,
    rating: item.rating,
    price: item.sizes[0].price.basic,
  }));

  try {
    await fs.writeFile(outputPath, JSON.stringify(newArray, null, 2));
    console.log(`The file has been saved to ${outputPath}`);
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }

  return newArray;
};
