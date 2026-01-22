const generateChangeLog = (oldData, newData) => {
  const changes = [];

  for (const key in newData) {
    if (key.startsWith("images.")) {
      const field = key.replace("images.", "");
      changes.push({
        field: `image.${field}`,
        oldValue: oldData.images?.[field] ?? null,
        newValue: newData[key],
      });
      continue;
    }

    if (oldData[key] !== newData[key]) {
      changes.push({
        field: key,
        oldValue: oldData[key] ?? null,
        newValue: newData[key],
      });
    }
  }

  return changes;
};
