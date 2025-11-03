export function formatTextToParagraphs(text) {
  if (!text) return null;

  // Split by line breaks, filter out empty lines
  const paragraphs = text
    .split(/\r?\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Return formatted JSX
  return paragraphs.map((p, i) => (
    <p className="my-3" key={i}>
      {p}
    </p>
  ));
}
