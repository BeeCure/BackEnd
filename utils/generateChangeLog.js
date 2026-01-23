export const generateChangeLog = (oldData, newData) => {
  const changes = [];

  // field yang TIDAK perlu masuk email
  const EXCLUDED_FIELDS = ["searchKeywords", "updatedAt", "createdAt"];

  for (const key in newData) {
    // ===== EXCLUDE SYSTEM / DERIVED FIELD =====
    if (EXCLUDED_FIELDS.includes(key)) continue;

    // ===== IMAGE FIELD =====
    if (key.startsWith("images.")) {
      const field = key.replace("images.", "");
      const oldValue = oldData.images?.[field] ?? null;
      const newValue = newData[key];

      if (oldValue !== newValue) {
        changes.push({
          field: `image.${field}`,
          oldValue,
          newValue,
        });
      }
      continue;
    }

    // ===== NORMAL FIELD =====
    const oldValue = oldData[key] ?? null;
    const newValue = newData[key];

    // deep compare biar aman (array / object)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
};
