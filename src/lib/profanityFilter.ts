const BLOCKED_WORDS = [
  "fuck", "shit", "ass", "bitch", "damn", "crap", "dick", "pussy",
  "cock", "bastard", "slut", "whore", "nigger", "faggot", "retard",
  "cunt", "twat", "wanker", "piss", "bollocks",
];

const SPAM_PATTERNS = [
  /(.)\1{4,}/i,           // repeated chars: "aaaaa"
  /^[^a-zA-Z]*$/,         // no letters at all
  /^(.{1,3})\1{3,}$/,     // repeated short patterns
];

export function validateLabelText(text: string): { valid: boolean; reason?: string } {
  const trimmed = text.trim();

  if (!trimmed) return { valid: false, reason: "Text cannot be empty" };
  if (trimmed.length < 3) return { valid: false, reason: "Text is too short" };
  if (trimmed.length > 80) return { valid: false, reason: "Text is too long (max 80 chars)" };

  const lower = trimmed.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lower)) {
      return { valid: false, reason: "Please keep it clean — no profanity allowed" };
    }
  }

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: "That looks like spam. Try a real description!" };
    }
  }

  return { valid: true };
}
