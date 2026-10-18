import { UTApi } from "uploadthing/server";

const filePath = process.argv[2];
if (!filePath) {
  console.log(JSON.stringify({ error: "No file path provided" }));
  process.exit(1);
}

try {
  const utapi = new UTApi();
  const bunFile = Bun.file(filePath);
  const buffer = await bunFile.arrayBuffer();
  const fileName =
    filePath.replace(/\\/g, "/").split("/").pop() ?? "file";
  const blob = new File([buffer], fileName, {
    type: bunFile.type || "application/octet-stream",
  });

  const result = await utapi.uploadFiles(blob);

  if (result.error) {
    console.log(JSON.stringify({ error: result.error.message }));
    process.exit(1);
  }

  console.log(
    JSON.stringify({
      url: result.data.url,
      key: result.data.key,
      name: result.data.name,
      size: result.data.size,
    }),
  );
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(JSON.stringify({ error: msg }));
  process.exit(1);
}
