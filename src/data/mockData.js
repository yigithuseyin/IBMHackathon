// ── Mock data shared across the app ──────────────────────────────────────────

export const currentUser = {
  id: "u1",
  name: "Alex Rivera",
  avatar: "AR",
  xp: 3420,
  rank: "Clean Machine",
  rankLevel: "silver",
  streak: 7,
  householdIds: ["h1", "h2"],
};

export const households = [
  {
    id: "h1",
    name: "Rivera Family Home",
    emoji: "🏠",
    memberCount: 4,
    adminId: "u1", // currentUser is admin here
    inviteCode: "RIV-2024",
    members: [
      { id: "u1", name: "Alex Rivera", avatar: "AR", xp: 3420, rank: "silver", streak: 7, isAdmin: true },
      { id: "u2", name: "Sam Rivera", avatar: "SR", xp: 2100, rank: "bronze", streak: 3, isAdmin: false },
      { id: "u3", name: "Jamie Rivera", avatar: "JR", xp: 4800, rank: "gold", streak: 12, isAdmin: false },
      { id: "u4", name: "Taylor Rivera", avatar: "TR", xp: 650, rank: "bronze", streak: 1, isAdmin: false },
    ],
    chores: [
      {
        id: "c1", name: "Vacuum Living Room", description: "Full vacuum including under furniture",
        maxPoints: 80, deadline: "2026-11-06T20:00:00", earliestTime: "2026-11-06T08:00:00",
        assignedTo: "anyone", recurrence: "Weekly", completedBy: null,
      },
      {
        id: "c2", name: "Wash the Dishes", description: "All dishes, pots, and cutlery",
        maxPoints: 50, deadline: "2026-11-06T22:00:00", earliestTime: "2026-11-06T18:00:00",
        assignedTo: "u2", recurrence: "Daily", completedBy: null,
      },
      {
        id: "c3", name: "Take Out Trash", description: "All bins including bathroom",
        maxPoints: 40, deadline: "2026-11-06T09:00:00", earliestTime: "2026-11-06T07:00:00",
        assignedTo: "u1", recurrence: "Weekly", completedBy: "u1",
        completedAt: "2026-11-06T07:45:00", earnedPoints: 35,
      },
      {
        id: "c4", name: "Clean Bathroom", description: "Toilet, sink, shower, mop floor",
        maxPoints: 100, deadline: "2026-11-07T18:00:00", earliestTime: "2026-11-07T10:00:00",
        assignedTo: "anyone", recurrence: "Weekly", completedBy: null,
      },
      {
        id: "c5", name: "Mow the Lawn", description: "Front and back garden",
        maxPoints: 120, deadline: "2026-11-08T17:00:00", earliestTime: "2026-11-08T09:00:00",
        assignedTo: "u3", recurrence: "Weekly", completedBy: null,
      },
    ],
  },
  {
    id: "h2",
    name: "Uni Flatmates",
    emoji: "🎓",
    memberCount: 3,
    adminId: "u5", // currentUser is member here
    inviteCode: "UNI-4521",
    members: [
      { id: "u5", name: "Morgan Lee", avatar: "ML", xp: 5200, rank: "gold", streak: 9, isAdmin: true },
      { id: "u1", name: "Alex Rivera", avatar: "AR", xp: 1800, rank: "bronze", streak: 5, isAdmin: false },
      { id: "u6", name: "Jordan Kim", avatar: "JK", xp: 920, rank: "bronze", streak: 2, isAdmin: false },
    ],
    chores: [
      {
        id: "c6", name: "Buy Groceries", description: "Weekly shop — check the shared list",
        maxPoints: 60, deadline: "2026-11-07T14:00:00", earliestTime: "2026-11-07T09:00:00",
        assignedTo: "u1", recurrence: "Weekly", completedBy: null,
      },
      {
        id: "c7", name: "Clean Kitchen", description: "Surfaces, hob, microwave",
        maxPoints: 70, deadline: "2026-11-06T21:00:00", earliestTime: "2026-11-06T15:00:00",
        assignedTo: "anyone", recurrence: "Daily", completedBy: null,
      },
    ],
  },
];
