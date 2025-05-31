// Previous imports remain unchanged...

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut, PlusCircle, History } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { data: attempts } = useQuery<{
    id: number;
    userId: number;
    quizData: any;
    score: number;
    timestamp: string;
  }[]>({
    queryKey: ["/api/quizzes"],
  });

  // Get unique quiz count by properly handling both array and single quiz formats
  const uniqueQuizCount = attempts?.reduce((acc: Set<string>, curr) => {
    const quizData = curr.quizData;
    if (Array.isArray(quizData)) {
      quizData.forEach(quiz => {
        if (quiz.subject) acc.add(quiz.subject);
      });
    } else if (quizData?.subject) {
      acc.add(quizData.subject);
    }
    return acc;
  }, new Set<string>())?.size || 0;

  // Sort attempts by timestamp in descending order
  const sortedAttempts = attempts?.slice().sort((a, b) => {
    return new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime();
  });

  return (
    <div className="min-h-screen bg-background px-4">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">Quiz Master</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Quiz
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/take">
                  <History className="h-4 w-4 mr-2" />
                  Take Quiz
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {attempts?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {uniqueQuizCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {attempts?.length
                    ? Math.round(
                        attempts.reduce((acc, curr) => acc + curr.score, 0) /
                          attempts.length
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          {sortedAttempts?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Recent Quizes</h3>
              <div className="space-y-4">
                {sortedAttempts.slice(0, 5).map((attempt) => (
                  <Card key={attempt.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">
                          {Array.isArray(attempt.quizData)
                            ? attempt.quizData.map(q => q.subject).join(", ")
                            : attempt.quizData.subject}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.timestamp!).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-lg font-semibold">
                        Score: {attempt.score}%
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
