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
import { Link, useLocation } from "wouter";
import { LatexRenderer } from "./latex-renderer";
import { MathJaxContext } from "better-react-mathjax";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type QuizDisplayProps = {
  quiz: Quiz;
  onComplete: (score: number) => void;
  subject?: string;
};

export function QuizDisplay({ quiz, onComplete, subject }: QuizDisplayProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Ensure quiz is treated as an array
  const quizArray = Array.isArray(quiz) ? quiz : [quiz];
  
  // Auto-select first subject and chapter if not provided
  const firstSubject = quizArray[0]?.subject || "";
  const firstChapter = quizArray[0]?.chapters[0]?.chapterName || "";
  
  const [selectedSubject, setSelectedSubject] = useState(subject || firstSubject);
  const [selectedChapter, setSelectedChapter] = useState(firstChapter);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showCurrentAnswer, setShowCurrentAnswer] = useState(false);
  
  // Enhanced analytics tracking
  const [quizStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [answerAttempts, setAnswerAttempts] = useState<number[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [firstAttemptAnswers, setFirstAttemptAnswers] = useState<string[]>([]);

  const currentSubject = quizArray.find((s) => s.subject === selectedSubject);
  const currentChapter = currentSubject?.chapters.find(
    (c) => c.chapterName === selectedChapter
  );
  const currentQuestion = currentChapter?.quizQuestions[currentQuestionIndex];

  // Mutation for submitting quiz results
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await apiRequest("POST", "/api/quiz-submissions", submissionData);
      return response.json();
    },
    onSuccess: () => {
      console.log("Quiz submitted successfully");
      toast({
        title: "Quiz Submitted Successfully!",
        description: "Redirecting to your submitted quizzes...",
      });
      // Navigate to submitted quizzes page after successful submission
      setTimeout(() => {
        setLocation("/submitted-quizzes");
      }, 2000); // Wait 2 seconds to show success message
    },
    onError: (error) => {
      console.error("Error submitting quiz:", error);
    },
  });

  const mathJaxConfig = {
    loader: { load: ["input/asciimath"] },
    asciimath: { displaystyle: true }
  };

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    const newAnswerAttempts = [...answerAttempts];
    const newFirstAttemptAnswers = [...firstAttemptAnswers];
    
    // Track if this is the first attempt for this question
    if (!newAnswers[currentQuestionIndex]) {
      newFirstAttemptAnswers[currentQuestionIndex] = answer;
      newAnswerAttempts[currentQuestionIndex] = 1;
    } else {
      newAnswerAttempts[currentQuestionIndex] = (newAnswerAttempts[currentQuestionIndex] || 0) + 1;
    }
    
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setFirstAttemptAnswers(newFirstAttemptAnswers);
    setAnswerAttempts(newAnswerAttempts);
    setShowCurrentAnswer(false);
  };

  // Function to calculate analytics
  const calculateAnalytics = () => {
    if (!currentChapter) return {};
    
    const questions = currentChapter.quizQuestions;
    const totalTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    const averageTimePerQuestion = questionTimes.length > 0
      ? questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length
      : totalTimeSpent / questions.length;
    
    // Calculate streaks
    let currentCorrectStreak = 0;
    let currentIncorrectStreak = 0;
    let maxCorrectStreak = 0;
    let maxIncorrectStreak = 0;
    let firstAttemptCorrect = 0;
    
    questions.forEach((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      const isFirstAttemptCorrect = question.correctAnswer === firstAttemptAnswers[index];
      
      if (isFirstAttemptCorrect) {
        firstAttemptCorrect++;
      }
      
      if (isCorrect) {
        currentCorrectStreak++;
        currentIncorrectStreak = 0;
        maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
      } else {
        currentIncorrectStreak++;
        currentCorrectStreak = 0;
        maxIncorrectStreak = Math.max(maxIncorrectStreak, currentIncorrectStreak);
      }
    });
    
    // Calculate question-level analytics
    const questionAnalytics = questions.map((question, index) => ({
      questionIndex: index + 1,
      timeSpent: questionTimes[index] || 0,
      attempts: answerAttempts[index] || 1,
      isCorrect: question.correctAnswer === answers[index],
      isFirstAttemptCorrect: question.correctAnswer === firstAttemptAnswers[index],
      difficulty: questionTimes[index] > averageTimePerQuestion * 1.5 ? 'hard' :
                 questionTimes[index] < averageTimePerQuestion * 0.5 ? 'easy' : 'medium',
      confidenceLevel: answerAttempts[index] === 1 ? 5 :
                      answerAttempts[index] === 2 ? 4 :
                      answerAttempts[index] === 3 ? 3 : 2
    }));
    
    return {
      totalTimeSpent,
      averageTimePerQuestion: Math.round(averageTimePerQuestion * 100) / 100,
      streakCorrect: maxCorrectStreak,
      streakIncorrect: maxIncorrectStreak,
      firstAttemptCorrect,
      hintsUsed,
      reviewCount,
      questionAnalytics
    };
  };

  const calculateScore = () => {
    if (!currentChapter) return 0;
    const correctAnswers = currentChapter.quizQuestions.reduce(
      (acc, q, idx) => (q.correctAnswer === answers[idx] ? acc + 1 : acc),
      0
    );
    return Math.round((correctAnswers / currentChapter.quizQuestions.length) * 100);
  };

  // Only show dropdowns if there are multiple subjects or chapters to choose from
  const showSubjectSelection = quizArray.length > 1 && !subject;
  const showChapterSelection = currentSubject && currentSubject.chapters.length > 1;

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="space-y-6 pb-24 bg-gradient-to-b from-sky-100 to-blue-100 rounded-lg shadow-lg p-6">
        {(showSubjectSelection || showChapterSelection) && (
          <div className="space-y-4">
            {showSubjectSelection && (
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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

            {showChapterSelection && (
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
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
        )}

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
                  {currentQuestion.options.map((option, optionIndex) => (
                    <div
                      key={`${currentQuestionIndex}-${optionIndex}`}
                      className={`flex items-center space-x-2 p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                        (showCurrentAnswer || showResults) &&
                        (option === currentQuestion.correctAnswer
                          ? "bg-green-100 border-green-200"
                          : option === answers[currentQuestionIndex]
                          ? "bg-red-100 border-red-200"
                          : "")
                      }`}
                    >
                      <RadioGroupItem value={option} id={`${currentQuestionIndex}-${optionIndex}`} />
                      <Label htmlFor={`${currentQuestionIndex}-${optionIndex}`} className="flex-1 cursor-pointer text-gray-800">
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
                        // Record time spent on current question
                        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                        const newQuestionTimes = [...questionTimes];
                        newQuestionTimes[currentQuestionIndex] = timeSpent;
                        setQuestionTimes(newQuestionTimes);
                        
                        setCurrentQuestionIndex(i => i - 1);
                        setQuestionStartTime(Date.now());
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
                    onClick={() => {
                      setShowCurrentAnswer(true);
                      setHintsUsed(prev => prev + 1);
                    }}
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
                    onClick={async () => {
                      if (!currentChapter) return;
                      
                      // Record time for the last question
                      const finalTimeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                      const finalQuestionTimes = [...questionTimes];
                      finalQuestionTimes[currentQuestionIndex] = finalTimeSpent;
                      setQuestionTimes(finalQuestionTimes);
                      
                      const score = calculateScore();
                      const correctAnswers = currentChapter.quizQuestions.reduce(
                        (acc, q, idx) => (q.correctAnswer === answers[idx] ? acc + 1 : acc),
                        0
                      );
                      
                      // Calculate analytics
                      const analytics = calculateAnalytics();
                      
                      // Prepare detailed submission data
                      const submissionData = currentChapter.quizQuestions.map((question, index) => ({
                        question: question.question,
                        correctAnswer: question.correctAnswer,
                        userAnswer: answers[index],
                        isCorrect: question.correctAnswer === answers[index],
                        explanation: question.explanation,
                        options: question.options
                      }));
                      
                      // Submit to database with enhanced analytics
                      if (user) {
                        try {
                          await submitQuizMutation.mutateAsync({
                            quizTitle: `${selectedSubject} - ${selectedChapter}`,
                            subject: selectedSubject,
                            chapter: selectedChapter,
                            totalQuestions: currentChapter.quizQuestions.length,
                            correctAnswers,
                            score,
                            submissionData,
                            // Enhanced analytics fields
                            totalTimeSpent: analytics.totalTimeSpent,
                            averageTimePerQuestion: analytics.averageTimePerQuestion,
                            difficultyLevel: score >= 80 ? 'easy' : score >= 60 ? 'medium' : 'hard',
                            completionPercentage: 100.00,
                            streakCorrect: analytics.streakCorrect,
                            streakIncorrect: analytics.streakIncorrect,
                            firstAttemptCorrect: analytics.firstAttemptCorrect,
                            questionsSkipped: 0,
                            hintsUsed: analytics.hintsUsed,
                            reviewCount: analytics.reviewCount,
                            confidenceScore: analytics.questionAnalytics ? analytics.questionAnalytics.reduce((acc: number, q: any) => acc + q.confidenceLevel, 0) / analytics.questionAnalytics.length : 3,
                            learningObjectiveMastery: {
                              subject: selectedSubject,
                              chapter: selectedChapter,
                              masteryLevel: score >= 80 ? 'mastered' : score >= 60 ? 'proficient' : 'developing',
                              conceptsStruggled: analytics.questionAnalytics ? analytics.questionAnalytics.filter((q: any) => !q.isCorrect).map((q: any) => q.questionIndex) : []
                            },
                            questionAnalytics: analytics.questionAnalytics || []
                          });
                        } catch (error) {
                          console.error("Failed to submit quiz:", error);
                        }
                      }
                      
                      setShowResults(true);
                      onComplete(score);
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white rounded-lg"
                    disabled={submitQuizMutation.isPending}
                  >
                    {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (currentChapter && currentQuestionIndex < currentChapter.quizQuestions.length - 1) {
                        // Record time spent on current question
                        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
                        const newQuestionTimes = [...questionTimes];
                        newQuestionTimes[currentQuestionIndex] = timeSpent;
                        setQuestionTimes(newQuestionTimes);
                        
                        setCurrentQuestionIndex(i => i + 1);
                        setQuestionStartTime(Date.now());
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
            <CardFooter className="flex gap-4">
              <Button asChild className="bg-green-500 hover:bg-green-700 text-white rounded-lg">
                <Link href="/submitted-quizzes">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Submissions
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-lg">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MathJaxContext>
  );
}