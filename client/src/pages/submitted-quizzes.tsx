import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, CheckCircle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

interface QuizSubmission {
  id: number;
  userId: string;
  quizTitle: string;
  subject: string;
  chapter: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  submissionData: any[];
  submittedAt: string;
}

export default function SubmittedQuizzesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch user's quiz submissions
  const { data: submissions, isLoading } = useQuery<QuizSubmission[]>({
    queryKey: ["/api/quiz-submissions"],
    enabled: !!user,
  });

  const handleViewDetails = (submissionId: number) => {
    setLocation(`/submitted-quizzes/${submissionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4">
        <div className="container py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Submitted Quizzes</h1>
          </div>
          <span>Welcome, {user?.username}</span>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Your Quiz History</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Total Submitted Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {submissions?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {submissions?.length ? (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">All Submissions</h3>
              <div className="grid gap-4">
                {submissions.map((submission) => {
                  // Format date safely
                  let formattedDate = "Unknown Date";
                  if (submission.submittedAt) {
                    try {
                      formattedDate = new Date(submission.submittedAt).toLocaleDateString();
                    } catch (error) {
                      formattedDate = "Invalid Date";
                    }
                  }

                  const scoreColor = submission.score >= 70 ? "text-green-600" : 
                                   submission.score >= 50 ? "text-yellow-600" : "text-red-600";

                  return (
                    <Card
                      key={submission.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleViewDetails(submission.id)}
                    >
                      <CardContent className="flex items-center justify-between p-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${submission.score >= 70 ? 'bg-green-100' : submission.score >= 50 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                            {submission.score >= 70 ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{submission.quizTitle}</h4>
                            <p className="text-sm text-muted-foreground mb-1">
                              Subject: {submission.subject} | Chapter: {submission.chapter}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {formattedDate}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`font-semibold ${scoreColor}`}>
                                Score: {submission.score}%
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {submission.correctAnswers}/{submission.totalQuestions} correct
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
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
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Submitted Quizzes</h3>
                  <p className="text-muted-foreground mb-4">
                    Take your first quiz to see your results here!
                  </p>
                  <Button asChild>
                    <Link href="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go to Quizzes
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