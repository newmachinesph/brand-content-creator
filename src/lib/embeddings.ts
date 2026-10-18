const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;
const EMBEDDING_MODEL = "text-embedding-3-small";
const DIMENSIONS = 512;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("VITE_OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL,
      dimensions: DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI Embedding API error (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.data[0].embedding as number[];
}

export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error("VITE_OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      dimensions: DIMENSIONS,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI Embedding API error (${res.status}): ${body}`);
  }

  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}
