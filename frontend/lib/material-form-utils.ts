export interface MaterialFormData {
  subject_id: string;
  chapter_id: string;
  topic_id: string;
  title: string;
  content_format: string;
  estimated_duration: number;
  content: string;
  status: string;
}

export function emptyMaterialForm(): MaterialFormData {
  return {
    subject_id: "",
    chapter_id: "",
    topic_id: "",
    title: "",
    content_format: "MARKDOWN",
    estimated_duration: 15,
    content: "",
    status: "PUBLISHED",
  };
}

export function mapMaterialToForm(m: any): MaterialFormData {
  return {
    subject_id: m.subject_id || m.subjectId || "",
    chapter_id: m.chapter_id || m.chapterId || "",
    topic_id: m.topic_id || m.topicId || "",
    title: m.title || "",
    content_format: m.content_format || m.contentFormat || "MARKDOWN",
    estimated_duration: m.estimated_duration || m.estimatedDuration || 15,
    content: m.body || m.content || "",
    status: m.status || "PUBLISHED",
  };
}
