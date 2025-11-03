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

export function autoFormatText(text) {
  if (!text) return null;

  // Split by sentence endings followed by a space and capital letter
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Group sentences into paragraphs of ~3 sentences each
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(
      sentences
        .slice(i, i + 3)
        .join(" ")
        .trim()
    );
  }

  return paragraphs.map((p, i) => <p key={i}>{p}</p>);
}

export function autoFormatTextString(text) {
  if (!text) return "";

  // Split text into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs = [];

  // Group every 3 sentences into a paragraph
  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(
      sentences
        .slice(i, i + 3)
        .join(" ")
        .trim()
    );
  }

  // ReactMarkdown interprets double newlines as paragraph breaks
  return paragraphs.join("\n\n");
}

export function normalizeMarkdownText(text) {
  if (!text) return "";
  // Convert escaped newlines into real line breaks
  return text.replace(/\\n/g, "\n").trim();
}
