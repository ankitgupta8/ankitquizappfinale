import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogOut, PlusCircle, Book, History } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch available quizzes
  const { data: availableQuizzes } = useQuery<{
    id: number;
    title: string;
    description: string;
    subject: string;
    quizData: any;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isActive: number;
  }[]>({
    queryKey: ["/api/quizzes"],
  });

  const handleQuizClick = (quizId: number) => {
    setLocation(`/take?quiz=${quizId}`);
  };

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
            <h2 className="text-3xl font-bold">Available Quizzes</h2>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/submitted-quizzes">
                  <History className="h-4 w-4 mr-2" />
                  View Submitted Quizzes
                </Link>
              </Button>
              <Button asChild>
                <Link href="/create">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Quiz
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Total Available Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {availableQuizzes?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {availableQuizzes?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">All Quizzes</h3>
              <div className="grid gap-4">
                {availableQuizzes.map((quiz) => {
                  // Format date safely
                  let formattedDate = "Unknown Date";
                  if (quiz.createdAt) {
                    try {
                      formattedDate = new Date(quiz.createdAt).toLocaleDateString();
                    } catch (error) {
                      formattedDate = "Invalid Date";
                    }
                  }

                  return (
                    <Card
                      key={quiz.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleQuizClick(quiz.id)}
                    >
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <Book className="h-6 w-6 text-primary" />
                          <div>
                            <h4 className="font-semibold text-lg">{quiz.title}</h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              Subject: {quiz.subject}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created: {formattedDate}
                            </p>
                            {quiz.description && (
                              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Click to take quiz →
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <Card>
                <CardContent className="text-center py-8">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Quizzes Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first quiz to get started!
                  </p>
                  <Button asChild>
                    <Link href="/create">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
