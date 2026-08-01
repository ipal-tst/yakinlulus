export interface StagingOption {
  label: string;
  content: string;
  is_correct: boolean;
}

export interface StagingRow {
  rowNum: number;
  content: string;
  difficulty: string;
  question_type: string;
  subject_id: string;
  explanation: string;
  options: StagingOption[];
  bloom_level?: string;
  source?: string;
  score?: number;
  negative_score?: number;
  estimated_time?: number;
}

export function nextOptionLabel(labels: string[]): string {
  const last = labels[labels.length - 1];
  if (!last) return "A";
  const code = last.charCodeAt(0);
  if (code >= "Z".charCodeAt(0)) throw new Error("Melebihi opsi Z");
  return String.fromCharCode(code + 1);
}

export function addOption(options: StagingOption[]): StagingOption[] {
  const next = nextOptionLabel(options.map(o => o.label));
  return [...options, { label: next, content: "", is_correct: false }];
}

export function removeOption(options: StagingOption[], index: number): StagingOption[] {
  if (options.length <= 2) return options;
  const removed = options[index];
  const rest = options.filter((_, i) => i !== index);
  if (removed?.is_correct && rest.length > 0) {
    rest[0] = { ...rest[0]!, is_correct: true };
  }
  return rest;
}
