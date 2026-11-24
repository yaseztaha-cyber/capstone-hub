export interface DiffPart {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

export function computeDiff(oldText: string, newText: string): DiffPart[] {
  if (oldText === newText) return [{ text: oldText, type: 'unchanged' }];

  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const dp: number[][] = Array.from({ length: oldWords.length + 1 }, () =>
    Array(newWords.length + 1).fill(0)
  );

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const parts: DiffPart[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      parts.unshift({ text: oldWords[i - 1], type: 'unchanged' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ text: newWords[j - 1], type: 'added' });
      j--;
    } else {
      parts.unshift({ text: oldWords[i - 1], type: 'removed' });
      i--;
    }
  }

  const merged: DiffPart[] = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].text += part.text;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}
