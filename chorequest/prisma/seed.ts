import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const systemBadges = [
  // Milestone badges
  {
    name: "First Step 🌟",
    description: "Complete your 1st chore",
    icon: "🌟",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "completionCount >= 1",
  },
  {
    name: "Getting Started 🚀",
    description: "Complete 10 chores",
    icon: "🚀",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "completionCount >= 10",
  },
  {
    name: "Century 💯",
    description: "Earn 100 points total",
    icon: "💯",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "totalPoints >= 100",
  },
  {
    name: "High Scorer 🏆",
    description: "Earn 500 points total",
    icon: "🏆",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "totalPoints >= 500",
  },
  {
    name: "Centurion ⚔️",
    description: "Earn 1000 points total",
    icon: "⚔️",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "totalPoints >= 1000",
  },
  {
    name: "Chore Champion 👑",
    description: "Complete 50 chores",
    icon: "👑",
    type: "MILESTONE",
    isNegative: false,
    awardCondition: "completionCount >= 50",
  },
  // Behaviour badges
  {
    name: "On a Roll 🔥",
    description: "3-day streak",
    icon: "🔥",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "currentStreak >= 3",
  },
  {
    name: "Hot Streak 🌶️",
    description: "7-day streak",
    icon: "🌶️",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "currentStreak >= 7",
  },
  {
    name: "Unstoppable ⚡",
    description: "14-day streak",
    icon: "⚡",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "currentStreak >= 14",
  },
  {
    name: "Early Bird 🐦",
    description: "Complete 5 chores early",
    icon: "🐦",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "earlyCompletions >= 5",
  },
  {
    name: "Perfect Week ✅",
    description: "Complete all assigned chores in a calendar week on time",
    icon: "✅",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "perfectWeek",
  },
  {
    name: "Top of the House 🥇",
    description: "Highest points in household for a week",
    icon: "🥇",
    type: "BEHAVIOUR",
    isNegative: false,
    awardCondition: "topHouseholdWeekly",
  },
  // Temporary badges
  {
    name: "Slacker 😴",
    description: "No chore completed in 3 days",
    icon: "😴",
    type: "TEMPORARY",
    isNegative: true,
    awardCondition: "noCompletionIn3Days",
  },
  {
    name: "Overdue ⚠️",
    description: "Has 1 or more overdue chores",
    icon: "⚠️",
    type: "TEMPORARY",
    isNegative: true,
    awardCondition: "hasOverdueChores",
  },
  {
    name: "Exempt 🛡️",
    description: "Member is exempt from scoring",
    icon: "🛡️",
    type: "TEMPORARY",
    isNegative: false,
    awardCondition: "isExempt",
  },
];

async function main() {
  console.log("Seeding system badges...");
  for (const badge of systemBadges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        icon: badge.icon,
        type: badge.type,
        isNegative: badge.isNegative,
        awardCondition: badge.awardCondition,
      },
      create: {
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        type: badge.type,
        isNegative: badge.isNegative,
        householdId: null,
        awardCondition: badge.awardCondition,
      },
    });
  }
  console.log(`Seeded ${systemBadges.length} system badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
