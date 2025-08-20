import { useState } from "react";
import { QuizForm } from "@/components/quiz-form";
import { QuizDisplay } from "@/components/quiz-display";
import { Quiz } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateQuiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; subject: string; quizData: Quiz }) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Quiz Created",
        description: "Your quiz has been saved successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create quiz",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePreview = (newQuiz: Quiz) => {
    setQuiz(newQuiz);
    // Extract subject from quiz data if not already set
    if (!subject && newQuiz) {
      const quizSubject = Array.isArray(newQuiz) ? newQuiz[0]?.subject : newQuiz.subject;
      if (quizSubject) {
        setSubject(quizSubject);
      }
    }
  };

  const handleSubmit = (newQuiz: Quiz) => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your quiz",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your quiz",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      quizData: newQuiz
    });
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
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter quiz title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        placeholder="Enter subject (e.g., Mathematics, Science)"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter quiz description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

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
                </div>
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
