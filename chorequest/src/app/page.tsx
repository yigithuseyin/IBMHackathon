import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">ChoreQuest</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        Gamified household chore management. Complete chores, earn points, climb
        the leaderboard.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Log In
        </a>
        <a
          href="/register"
          className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
        >
          Register
        </a>
      </div>
    </main>
  );
}
