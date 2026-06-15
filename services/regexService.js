const RE2 = require("re2");

function runRegex({ pattern, text, flags = "g" }) {
  const regex = new RE2(pattern, flags);
  const matches = [];
  const start = performance.now();

  let match;
  let count = 0;

  while ((match = regex.exec(text)) !== null) {
    const rawGroups = match.groups ?? match.slice(1);
    const groupItems = Array.isArray(rawGroups)
      ? rawGroups.map((value, index) => ({ name: `$${index + 1}`, value }))
      : Object.entries(rawGroups).map(([name, value]) => ({ name, value }));

    matches.push({
      value: match[0],
      index: match.index,
      groups: groupItems,
    });

    count += 1;
    if (count > 10000) {
      break;
    }

    if (match[0] === "") {
      break;
    }
  }

  const end = performance.now();

  return {
    matches,
    executionTime: end - start,
  };
}

module.exports = {
  runRegex,
};
