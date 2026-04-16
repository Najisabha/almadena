export type InstructorStudentCommentItem = {
  student_name: string;
  comment: string;
};

/** يقرأ JSON `[{ student_name, comment }]` أو نصاً قديماً كتعليق واحد بدون اسم */
export function parseInstructorStudentComments(raw: string | null | undefined): InstructorStudentCommentItem[] {
  const t = raw?.trim();
  if (!t) return [];
  try {
    const parsed = JSON.parse(t) as unknown;
    if (!Array.isArray(parsed)) return legacyAsList(t);
    const out: InstructorStudentCommentItem[] = [];
    for (const item of parsed) {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const name = String(o.student_name ?? o.name ?? o.name_ar ?? "").trim();
        const comment = String(o.comment ?? o.comment_ar ?? "").trim();
        if (name || comment) out.push({ student_name: name, comment });
      }
    }
    return out;
  } catch {
    return legacyAsList(t);
  }
}

function legacyAsList(text: string): InstructorStudentCommentItem[] {
  return [{ student_name: "", comment: text }];
}

export function serializeInstructorStudentComments(items: InstructorStudentCommentItem[]): string | null {
  const cleaned = items
    .map((x) => ({ student_name: x.student_name.trim(), comment: x.comment.trim() }))
    .filter((x) => x.student_name || x.comment);
  if (cleaned.length === 0) return null;
  return JSON.stringify(cleaned);
}
