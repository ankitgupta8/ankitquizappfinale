import { useState } from "react";
import { Quiz } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Eye, Home } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { LatexRenderer } from "./latex-renderer";

type QuizDisplayProps = {
  quiz: Quiz;
  onComplete: (score: number) => void;
  subject?: string;
};

export function QuizDisplay({ quiz, onComplete, subject }: QuizDisplayProps) {
  const [selectedSubject, setSelectedSubject] = useState(subject || "");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCurrentAnswer, setShowCurrentAnswer] = useState(false);

  // Ensure quiz is treated as an array
  const quizArray = Array.isArray(quiz) ? quiz : [quiz];
  const currentSubject = quizArray.find((s) => s.subject === selectedSubject);
  const currentChapter = currentSubject?.chapters.find(
    (c) => c.chapterName === selectedChapter
  );
  const currentQuestion = currentChapter?.quizQuestions[currentQuestionIndex];

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowCurrentAnswer(false);
  };

  const calculateScore = () => {
    if (!currentChapter) return 0;
    const correctAnswers = currentChapter.quizQuestions.reduce(
      (acc, q, idx) => (q.correctAnswer === answers[idx] ? acc + 1 : acc),
      0
    );
    return Math.round((correctAnswers / currentChapter.quizQuestions.length) * 100);
  };

  // Rest of the component remains unchanged
  return (
    <div className="space-y-6 pb-24 bg-gradient-to-b from-sky-100 to-blue-100 rounded-lg shadow-lg p-6">
      {!selectedSubject || !selectedChapter ? (
        <div className="space-y-4">
          {!subject && !selectedSubject && (
            <Select onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {quizArray.map((subject) => (
                  <SelectItem key={subject.subject} value={subject.subject}>
                    {subject.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(selectedSubject || subject) && (
            <Select onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {currentSubject?.chapters.map((chapter) => (
                  <SelectItem key={chapter.chapterName} value={chapter.chapterName}>
                    {chapter.chapterName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ) : null}

      {currentQuestion && (
        <>
          <Card className="rounded-lg shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Question {currentQuestionIndex + 1} of{" "}
                {currentChapter?.quizQuestions.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg text-gray-700">
                <LatexRenderer content={currentQuestion.question} />
              </div>

              <RadioGroup
                value={answers[currentQuestionIndex]}
                onValueChange={handleAnswer}
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option}
                    className={`flex items-center space-x-2 p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                      (showCurrentAnswer || showResults) &&
                      (option === currentQuestion.correctAnswer
                        ? "bg-green-100 border-green-200"
                        : option === answers[currentQuestionIndex]
                        ? "bg-red-100 border-red-200"
                        : "")
                    }`}
                  >
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer text-gray-800">
                      <LatexRenderer content={option} />
                    </Label>
                    {(showCurrentAnswer || showResults) && (
                      <>
                        {option === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                        )}
                        {option === answers[currentQuestionIndex] &&
                          option !== currentQuestion.correctAnswer && (
                            <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                          )}
                      </>
                    )}
                  </div>
                ))}
              </RadioGroup>

              {(showCurrentAnswer || showResults) && (
                <Alert className="rounded-lg shadow-md">
                  <AlertDescription>
                    <p className="font-medium mb-2 text-gray-800">Explanation:</p>
                    <div className="text-gray-700">
                      <LatexRenderer content={currentQuestion.explanation} />
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 rounded-t-lg">
            <div className="container flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(i => i - 1);
                      setShowCurrentAnswer(false);
                    }
                  }}
                  disabled={currentQuestionIndex === 0}
                  className="rounded-lg"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCurrentAnswer(true)}
                  disabled={!answers[currentQuestionIndex]}
                  className="rounded-lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Show Answer
                </Button>
              </div>

              {answers.length === currentChapter?.quizQuestions.length &&
              answers.every(answer => answer) &&
              !showResults ? (
                <Button
                  onClick={() => {
                    setShowResults(true);
                    onComplete(calculateScore());
                  }}
                  className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg"
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (currentChapter && currentQuestionIndex < currentChapter.quizQuestions.length - 1) {
                      setCurrentQuestionIndex(i => i + 1);
                      setShowCurrentAnswer(false);
                    }
                  }}
                  disabled={
                    !answers[currentQuestionIndex] ||
                    currentQuestionIndex === currentChapter!.quizQuestions.length - 1
                  }
                  className="rounded-lg"
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {showResults && (
        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-xl font-bold text-gray-800">
                Final Score: {calculateScore()}%
              </p>
              <div className="space-y-6">
                {currentChapter?.quizQuestions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <p className="font-medium text-gray-800">
                      Question {index + 1}: <LatexRenderer content={question.question} />
                    </p>
                    <p className={answers[index] === question.correctAnswer ? "text-green-600" : "text-red-600"}>
                      Your Answer: <LatexRenderer content={answers[index]} />
                    </p>
                    <p className="text-green-600">
                      Correct Answer: <LatexRenderer content={question.correctAnswer} />
                    </p>
                    <div className="text-sm text-gray-600">
                      <LatexRenderer content={question.explanation} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}