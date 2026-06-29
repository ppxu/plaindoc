export function parseFirstJsonObject(content: string): unknown | undefined {
  for (const candidate of findBalancedJsonObjectCandidates(content)) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep scanning: models may include prose examples before the actual JSON block.
    }
  }
  return undefined;
}

function findBalancedJsonObjectCandidates(content: string): string[] {
  const candidates: string[] = [];
  for (let start = content.indexOf("{"); start !== -1; start = content.indexOf("{", start + 1)) {
    const end = findBalancedObjectEnd(content, start);
    if (end !== -1) {
      candidates.push(content.slice(start, end + 1));
    }
  }
  return candidates;
}

function findBalancedObjectEnd(content: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < content.length; index += 1) {
    const char = content[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}
