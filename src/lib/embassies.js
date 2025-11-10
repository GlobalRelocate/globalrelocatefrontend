const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const QUERY = (countryQid, language) => `
SELECT 
  ?embassy ?embassyLabel ?ownerCountry ?ownerCountryLabel ?location ?locationLabel 
  (COALESCE(
    SAMPLE(?streetAddress),
    SAMPLE(?fullAddress),
    SAMPLE(?postalCode),
    "—"
  ) AS ?address)
  (SAMPLE(?website) AS ?website)
WHERE {
  # Embassy (or subclass)
  ?embassy wdt:P31/wdt:P279* wd:Q3917681 .
  
  # Located in a city in the selected country (host country)
  ?embassy wdt:P131 ?location .
  ?location wdt:P17 wd:${countryQid} .

  # OWNER COUNTRY: the country that operates the embassy
  ?embassy wdt:P137 ?ownerCountry . 

  # Address
  OPTIONAL { ?embassy wdt:P969 ?streetAddress }
  OPTIONAL { ?embassy wdt:P6375 ?fullAddress }
  OPTIONAL { ?embassy wdt:P281 ?postalCode }

  OPTIONAL { ?embassy wdt:P856 ?website }

  # Labels in user's language
  SERVICE wikibase:label { 
    bd:serviceParam wikibase:language "${language}".
  }
}

GROUP BY ?embassy ?embassyLabel ?ownerCountry ?ownerCountryLabel ?location ?locationLabel
LIMIT 500
`;

export const getEmbassies = async (countryQid, language = "en") => {
  const response = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      Accept: "application/sparql-results+json",
      "User-Agent": "GlobalRelocate-App/1.0",
    },
    body: QUERY(countryQid, language),
  });

  if (!response.ok) {
    throw new Error(`SPARQL error: ${response.status}`);
  }

  const data = await response.json();

  const result = data.results.bindings.map((b) => ({
    embassy: b.embassy.value,
    embassyLabel: b.embassyLabel.value,
    owner: b.ownerCountry?.value ?? "",
    owner: b.ownerCountryLabel?.value ?? "Unknown",
    location: b.location?.value,
    locationLabel: b.locationLabel?.value,
    address: b.address?.value,
    website: b.website?.value,
  }));

  return result;
};
