import path from "path";

async function pdfToText(buffer: Buffer): Promise<string> {
  // pdf-parse changed its API between versions, so this handles both
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("pdf-parse");
  if (typeof mod.PDFParse === "function") {
    const parser = new mod.PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text as string;
    } finally {
      await parser.destroy?.();
    }
  }
  const parse = mod.default ?? mod;
  const result = await parse(buffer);
  return result.text as string;
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  let text: string;
  if (ext === ".pdf") {
    text = await pdfToText(buffer);
  } else if (ext === ".txt" || ext === ".md") {
    text = buffer.toString("utf8");
  } else {
    throw new Error("Only .pdf, .txt and .md files are supported");
  }
  return text.replace(/\u0000/g, "");
}