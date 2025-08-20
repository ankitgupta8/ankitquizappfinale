import { useState, useEffect } from "react";
import { QuizDisplay } from "@/components/quiz-display";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Quiz, QuizRecord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Book } from "lucide-react";
import { useSearch } from "wouter";

export default function TakeQuiz() {
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRecord | null>(null);
  const { toast } = useToast();
  const searchParams = useSearch();

  // Check if we have a quiz ID from URL parameters
  const urlParams = new URLSearchParams(searchParams);
  const quizIdFromUrl = urlParams.get('quiz');

  const { data: quizzes, isLoading, error } = useQuery<QuizRecord[]>({
    queryKey: ["/api/quizzes"],
  });

  // Handle direct quiz selection from URL parameter
  useEffect(() => {
    if (quizzes && quizIdFromUrl && !selectedQuiz) {
      const quiz = quizzes.find(q => q.id === parseInt(quizIdFromUrl));
      if (quiz) {
        setSelectedQuiz(quiz);
      }
    }
  }, [quizzes, quizIdFromUrl, selectedQuiz]);

  const submitMutation = useMutation({
    mutationFn: async (data: { quizId: number; score: number }) => {
      const res = await apiRequest("POST", "/api/quiz-attempts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      toast({
        title: "Quiz Completed",
        description: "Your attempt has been saved",
      });
      setSelectedQuiz(null); // Return to quiz selection
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save quiz attempt",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = (score: number) => {
    if (selectedQuiz) {
      submitMutation.mutate({
        quizId: selectedQuiz.id,
        score,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load quizzes. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Card>
            <CardHeader>
              <CardTitle>Take Quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No quizzes available. Create a quiz first!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Take Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedQuiz && !quizIdFromUrl ? (
              <div className="grid gap-4">
                {quizzes.map((quiz) => (
                  <Card
                    key={quiz.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Book className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Subject: {quiz.subject}
                          </p>
                          {quiz.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : selectedQuiz ? (
              <QuizDisplay
                quiz={typeof selectedQuiz.quizData === 'string'
                  ? JSON.parse(selectedQuiz.quizData)
                  : selectedQuiz.quizData as Quiz}
                onComplete={handleComplete}
              />
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-border" />
                <span className="ml-2">Loading quiz...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}