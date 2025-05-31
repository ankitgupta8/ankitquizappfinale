import { useState } from "react";
import { QuizForm } from "@/components/quiz-form";
import { QuizDisplay } from "@/components/quiz-display";
import { Quiz } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";

export default function CreateQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: { quizData: Quiz; score: number }) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Created",
        description: "Your quiz has been saved successfully",
      });
      setLocation("/");
    },
  });

  const handlePreview = (newQuiz: Quiz) => {
    setQuiz(newQuiz);
  };

  const handleSubmit = (newQuiz: Quiz) => {
    submitMutation.mutate({ quizData: newQuiz, score: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create">
              <TabsList>
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="preview" disabled={!quiz}>
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Need help converting your text to JSON format? Use the </span>
                  <a 
                    href="https://ttj.koyeb.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Text to JSON Converter
                  </a>
                </div>
                <QuizForm onPreview={handlePreview} onSubmit={handleSubmit} />
              </TabsContent>

              <TabsContent value="preview">
                {quiz && (
                  <QuizDisplay
                    quiz={quiz}
                    onComplete={() => {
                      // Preview mode - no completion handling needed
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
