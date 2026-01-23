export const generateSearchKeywords = ({
  name,
  scientificName,
  genus,
  subGenus,
}) => {
  const sourceTexts = [name, scientificName, genus, subGenus]
    .filter(Boolean)
    .map((v) => v.toLowerCase());

  const keywords = new Set();

  sourceTexts.forEach((text) => {
    const words = text.split(/\s+/);

    words.forEach((word) => {
      for (let i = 1; i <= word.length; i++) {
        keywords.add(word.substring(0, i));
      }
    });
  });

  return Array.from(keywords);
};
