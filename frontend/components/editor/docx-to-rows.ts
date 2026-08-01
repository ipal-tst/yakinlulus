export interface DocxOption {
  label: string;
  option_text: string;
  is_correct: boolean;
}

export interface StagingQuestionRow {
  id: string;
  question_type: string;
  content: string;
  difficulty: string;
  bloom_level: string;
  source: string;
  subject_id: string;
  chapter_id: string;
  explanation: string;
  has_image: boolean;
  options: DocxOption[];
}

interface Defaults {
  source: string;
  subject_id: string;
  chapter_id: string;
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").trim();
}

export function renderBlockToMarkdown(el: Element): string {
  if (el.tagName === "TABLE") {
    const rows = Array.from(el.querySelectorAll("tr"));
    const lines = rows.map((tr) => {
      const cells = Array.from(tr.querySelectorAll("th,td")).map((c) => escapeCell(c.textContent || ""));
      return `| ${cells.join(" | ")} |`;
    });
    if (lines.length === 0) return "";
    const header = lines[0]!;
    const sep = `| ${header.split("|").slice(1, -1).map(() => "---").join(" | ")} |`;
    return [header, sep, ...lines.slice(1)].join("\n");
  }
  if (el.tagName === "IMG") {
    const src = el.getAttribute("src") || "";
    const alt = el.getAttribute("alt") || "gambar";
    return `![${alt}](${src})`;
  }
  if (el.tagName === "H1" || el.tagName === "H2") {
    return `## ${el.textContent || ""}`.trim();
  }
  return (el.textContent || "").trim();
}

function isQuestionStart(text: string): boolean {
  return /^\s*(soal\s*)?\d+[\.\)]\s+/i.test(text);
}

function stripQuestionPrefix(text: string): string {
  return text.replace(/^\s*(soal\s*)?\d+[\.\)]\s*/i, "");
}

function detectOptionLine(text: string): { label: string; text: string } | null {
  const m = text.match(/^([A-Ea-e])[\.\)]\s*(.*)/);
  if (!m) return null;
  return { label: m[1]!.toUpperCase(), text: m[2]! };
}

export function htmlToStagingRows(html: string, defaults: Defaults): StagingQuestionRow[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks: Element[] = Array.from(doc.body.children);

  const blocksByQuestion: Element[][] = [];
  let current: Element[] = [];

  for (const el of blocks) {
    const text = (el.textContent || "").trim();
    if ((el.tagName === "P" || el.tagName === "H3") && isQuestionStart(text) && current.length > 0) {
      blocksByQuestion.push(current);
      current = [];
    }
    current.push(el);
  }
  if (current.length > 0) blocksByQuestion.push(current);

  const rows: StagingQuestionRow[] = [];

  blocksByQuestion.forEach((blockEls, idx) => {
    let contentParts: string[] = [];
    let explanation = "";
    let hasImage = false;
    const options: DocxOption[] = [];

    for (const el of blockEls) {
      if (el.tagName === "IMG") {
        hasImage = true;
        contentParts.push(renderBlockToMarkdown(el));
        continue;
      }
      if (el.tagName === "TABLE") {
        contentParts.push(renderBlockToMarkdown(el));
        continue;
      }
      if (el.tagName === "H1" || el.tagName === "H2") continue;

      const text = (el.textContent || "").trim();
      if (!text) continue;

      const opt = detectOptionLine(text);
      if (opt) {
        options.push({ label: opt.label, option_text: opt.text, is_correct: false });
        continue;
      }

      const expMatch = text.match(/^(pembahasan|penjelasan|explanation)\s*:\s*(.*)/i);
      if (expMatch) {
        explanation = expMatch[2]!;
        continue;
      }

      if (options.length === 0) {
        contentParts.push(isQuestionStart(text) ? stripQuestionPrefix(text) : text);
      }
    }

    const content = contentParts.filter(Boolean).join("\n\n");
    if (!content && options.length === 0) return;

    rows.push({
      id: `docx-${Date.now()}-${idx}`,
      question_type: "SINGLE_CHOICE",
      content: content || `Soal ${idx + 1}`,
      difficulty: "MEDIUM",
      bloom_level: "C3",
      source: defaults.source,
      subject_id: defaults.subject_id,
      chapter_id: defaults.chapter_id,
      explanation,
      has_image: hasImage,
      options:
        options.length > 0
          ? options
          : [
              { label: "A", option_text: "", is_correct: false },
              { label: "B", option_text: "", is_correct: false },
              { label: "C", option_text: "", is_correct: false },
            ],
    });
  });

  return rows;
}

async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export async function docxFileToHtml(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await fileToArrayBuffer(file);
  const result = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      convertImage: mammoth.images.imgElement(function (image: any) {
        return image.read("base64").then(function (imageBuffer: string) {
          return { src: "data:" + image.contentType + ";base64," + imageBuffer };
        });
      }),
    }
  );
  return result.value;
}

export async function uploadDataUriImages(content: string): Promise<string> {
  const dataUriRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
  const images: { alt: string; uri: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = dataUriRegex.exec(content)) !== null) {
    images.push({ alt: match[1]!, uri: match[2]! });
  }
  if (images.length === 0) return content;

  const token = localStorage.getItem("token");
  let updated = content;
  for (const img of images) {
    const blob = await (await fetch(img.uri)).blob();
    const formData = new FormData();
    formData.append("file", blob, `docx-${Date.now()}-${images.indexOf(img)}.png`);
    formData.append("entity_type", "QUESTION");
    const res = await fetch("/api/v1/media/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    const url = json.data?.url;
    if (!json.success || !url) throw new Error(json.message || "Upload gambar gagal");
    updated = updated.replace(`![${img.alt}](${img.uri})`, `![${img.alt}](${url})`);
  }
  return updated;
}

export async function docxToStagingRows(file: File, defaults: Defaults): Promise<StagingQuestionRow[]> {
  const html = await docxFileToHtml(file);
  const rows = htmlToStagingRows(html, defaults);
  for (const row of rows) {
    if (row.has_image) {
      row.content = await uploadDataUriImages(row.content);
    }
  }
  return rows;
}
