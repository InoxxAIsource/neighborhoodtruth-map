const BLOCKED = [
  "fuck", "shit", "ass", "bitch", "cunt", "dick", "cock", "pussy",
  "nigger", "nigga", "faggot", "retard", "whore", "slut",
];

export function validateLabelText(text: string): { valid: boolean; reason?: string } {
  const lower = text.toLowerCase();
  for (const word of BLOCKED) {
    if (lower.includes(word)) {
      return { valid: false, reason: "Your label contains inappropriate language." };
    }
  }
  if (text.trim().length < 2) {
    return { valid: false, reason: "Label must be at least 2 characters." };
  }
  if (text.length > 80) {
    return { valid: false, reason: "Label must be 80 characters or fewer." };
  }
  return { valid: true };
}
