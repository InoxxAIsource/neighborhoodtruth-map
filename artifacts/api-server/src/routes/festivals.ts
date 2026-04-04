import { Router, type Request, type Response } from "express";

const router = Router();

// Annual festival calendar with approximate Gregorian dates (updated each year)
// For lunar/variable festivals the month/day represent the typical central date.
// Year is ignored in comparison — only month+day matters for "is it upcoming in 30 days?".
interface FestivalDef {
  name: string;
  emoji: string;
  month: number; // 1-based
  day: number;
  durationDays: number;
  religion?: string;
}

const FESTIVALS: FestivalDef[] = [
  { name: "Makar Sankranti", emoji: "🪁", month: 1, day: 14, durationDays: 1 },
  { name: "Pongal", emoji: "🍯", month: 1, day: 14, durationDays: 4 },
  { name: "Republic Day", emoji: "🇮🇳", month: 1, day: 26, durationDays: 1 },
  { name: "Basant Panchami", emoji: "🌼", month: 2, day: 3, durationDays: 1 },
  { name: "Maha Shivratri", emoji: "🕉️", month: 2, day: 26, durationDays: 1 },
  { name: "Holi", emoji: "🎨", month: 3, day: 14, durationDays: 2 },
  { name: "Ugadi / Gudi Padwa", emoji: "🌿", month: 3, day: 30, durationDays: 1 },
  { name: "Ram Navami", emoji: "🏹", month: 4, day: 6, durationDays: 1 },
  { name: "Baisakhi", emoji: "🌾", month: 4, day: 13, durationDays: 1 },
  { name: "Eid al-Fitr", emoji: "🌙", month: 4, day: 20, durationDays: 3, religion: "muslim" },
  { name: "Akshaya Tritiya", emoji: "🪙", month: 5, day: 10, durationDays: 1 },
  { name: "Eid al-Adha", emoji: "🐄", month: 6, day: 28, durationDays: 3, religion: "muslim" },
  { name: "Rath Yatra", emoji: "🎡", month: 7, day: 7, durationDays: 1 },
  { name: "Raksha Bandhan", emoji: "🎀", month: 8, day: 9, durationDays: 1 },
  { name: "Independence Day", emoji: "🇮🇳", month: 8, day: 15, durationDays: 1 },
  { name: "Janmashtami", emoji: "🦚", month: 8, day: 16, durationDays: 1 },
  { name: "Ganesh Chaturthi", emoji: "🐘", month: 9, day: 2, durationDays: 10 },
  { name: "Onam", emoji: "🌺", month: 9, day: 5, durationDays: 10 },
  { name: "Navratri", emoji: "💃", month: 10, day: 3, durationDays: 9 },
  { name: "Durga Puja", emoji: "🪔", month: 10, day: 3, durationDays: 5 },
  { name: "Dussehra", emoji: "🏹", month: 10, day: 12, durationDays: 1 },
  { name: "Karwa Chauth", emoji: "🌕", month: 10, day: 20, durationDays: 1 },
  { name: "Diwali", emoji: "🪔", month: 11, day: 1, durationDays: 5 },
  { name: "Bhai Dooj", emoji: "👫", month: 11, day: 3, durationDays: 1 },
  { name: "Chhath Puja", emoji: "☀️", month: 11, day: 7, durationDays: 4 },
  { name: "Guru Nanak Jayanti", emoji: "🌟", month: 11, day: 15, durationDays: 1 },
  { name: "Christmas", emoji: "🎄", month: 12, day: 25, durationDays: 1 },
  { name: "New Year's Eve", emoji: "🎆", month: 12, day: 31, durationDays: 1 },
];

interface UpcomingFestival {
  name: string;
  emoji: string;
  daysUntil: number;
  isToday: boolean;
  isActive: boolean;
}

function getUpcomingFestivals(withinDays = 30): UpcomingFestival[] {
  const now = new Date();
  const results: UpcomingFestival[] = [];

  for (const fest of FESTIVALS) {
    // Try this year and next year to handle year-boundary wrap
    for (const yearDelta of [0, 1]) {
      const year = now.getFullYear() + yearDelta;
      const festStart = new Date(year, fest.month - 1, fest.day);
      const festEnd = new Date(year, fest.month - 1, fest.day + fest.durationDays - 1);

      const msUntilStart = festStart.getTime() - now.getTime();
      const daysUntilStart = Math.floor(msUntilStart / (1000 * 60 * 60 * 24));
      const isActive = now >= festStart && now <= festEnd;
      const isToday = daysUntilStart === 0;

      if (isActive || (daysUntilStart >= 0 && daysUntilStart <= withinDays)) {
        results.push({
          name: fest.name,
          emoji: fest.emoji,
          daysUntil: isActive ? 0 : daysUntilStart,
          isToday,
          isActive,
        });
        break; // Don't double-count for next year
      }
    }
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return results;
}

router.get("/", (_req: Request, res: Response) => {
  const festivals = getUpcomingFestivals(30);
  res.setHeader("Cache-Control", "public, max-age=3600");
  return res.json({ festivals });
});

export default router;
