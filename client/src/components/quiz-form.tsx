import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quizSchema, type Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

type QuizFormProps = {
  onSubmit: (quiz: Quiz) => void;
  onPreview: (quiz: Quiz) => void;
};

export function QuizForm({ onSubmit, onPreview }: QuizFormProps) {
  const [preview, setPreview] = useState<Quiz | null>(null);
  const { toast } = useToast();

  const form = useForm<{ json: string }>({
    defaultValues: {
      json: "",
    },
  });

  const validateAndParseJSON = (jsonString: string): Quiz | null => {
    try {
      const parsed = JSON.parse(jsonString);
      const validated = quizSchema.parse(parsed);
      return validated;
    } catch (error) {
      toast({
        title: "Invalid Quiz Format",
        description: "Please check your JSON structure and try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const handlePreview = () => {
    const quiz = validateAndParseJSON(form.getValues().json);
    if (quiz) {
      setPreview(quiz);
      onPreview(quiz);
    }
  };

  const handleSubmit = () => {
    const quiz = validateAndParseJSON(form.getValues().json);
    if (quiz) {
      onSubmit(quiz);
    }
  };

  const sampleQuiz = {
    subject: "Mathematics",
    chapters: [
      {
        chapterName: "Calculus",
        quizQuestions: [
          {
            question: "Evaluate the expression: `(2 Delta)/a + Delta/b` when `Delta = 10`, `a = 2`, and `b = 5`",
            options: [
              "`15`",
              "`10`",
              "`12`",
              "`13`"
            ],
            correctAnswer: "`12`",
            explanation: "Let's solve this step by step:\n\n`((2 Delta)/a + Delta/b) = ((2(10))/2 + 10/5) = (10 + 2) = 12`"
          }
        ]
      }
    ]
  };

  return (
    <div className="form-container space-y-6 rounded-lg p-6 bg-gray-100 shadow-md">
      <Textarea
        placeholder="Paste your quiz JSON here..."
        className="min-h-[300px] font-mono rounded-lg p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        {...form.register("json")}
      />

      {preview && (
        <Card className="bg-gray-200 rounded-lg shadow-sm">
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle2 className="text-green-500 h-5 w-5" />
            <span>Quiz format validated successfully!</span>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">Sample Quiz Format:</p>
          <Button 
            variant="outline" 
            className="text-xs"
            onClick={() => {
              navigator.clipboard.writeText("Convert above text into same as below, keep all the keys same as sample"+JSON.stringify(sampleQuiz, null, 2));
            }}
          >
            Copy
          </Button>
        </div>
        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(sampleQuiz, null, 2)}
        </pre>
      </div>

      <div className="flex gap-4">
        <Button onClick={handlePreview} variant="outline" className="rounded-lg">
          Preview Quiz
        </Button>
        <Button onClick={handleSubmit} disabled={!preview} className="rounded-lg bg-blue-500 hover:bg-blue-700 text-white">
          Submit Quiz
        </Button>
      </div>
    </div>
  );
}
