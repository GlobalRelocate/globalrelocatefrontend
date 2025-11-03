const assetsURL = import.meta.env.VITE_API_ASSETS_URL;

export const loadCountryImages = async () => {
  try {
    const res = await fetch(`${assetsURL}/countries.json`);
    const data = await res.json();

    // Transform the data into a map of full URLs
    const imageMap = {};
    for (const [code, files] of Object.entries(data)) {
      imageMap[code] = files.map(
        (name) => `${assetsURL}/countries/${code}/${name}`
      );
    }

    return imageMap;
  } catch (err) {
    console.error("Error loading local images:", err);
    return {};
  }
};
