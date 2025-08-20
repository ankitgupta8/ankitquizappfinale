import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Link, useRoute } from "wouter";
import { LatexRenderer } from "@/components/latex-renderer";
import { MathJaxContext } from "better-react-mathjax";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuizSubmission {
  id: number;
  userId: string;
  quizTitle: string;
  subject: string;
  chapter: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  submissionData: Array<{
    question: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    explanation: string;
    options: string[];
  }>;
  submittedAt: string;
  // Enhanced analytics fields
  totalTimeSpent?: number;
  averageTimePerQuestion?: number;
  difficultyLevel?: string;
  completionPercentage?: number;
  streakCorrect?: number;
  streakIncorrect?: number;
  firstAttemptCorrect?: number;
  questionsSkipped?: number;
  hintsUsed?: number;
  reviewCount?: number;
  confidenceScore?: number;
  learningObjectiveMastery?: any;
  questionAnalytics?: Array<{
    questionIndex: number;
    timeSpent: number;
    attempts: number;
    isCorrect: boolean;
    isFirstAttemptCorrect: boolean;
    difficulty: string;
    confidenceLevel: number;
  }>;
}

export default function QuizSubmissionDetailPage() {
  const { user } = useAuth();
  const [match, params] = useRoute("/submitted-quizzes/:id");
  const submissionId = params?.id ? parseInt(params.id) : null;
  
  // Fetch specific quiz submission
  const { data: submission, isLoading, error } = useQuery<QuizSubmission>({
    queryKey: [`/api/quiz-submissions/${submissionId}`],
    enabled: !!user && !!submissionId,
  });

  const mathJaxConfig = {
    loader: { load: ["input/asciimath"] },
    asciimath: { displaystyle: true }
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

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-background px-4">
        <div className="container py-8">
          <Card>
            <CardContent className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Quiz Submission Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The quiz submission you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button asChild>
                <Link href="/submitted-quizzes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Submissions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Format date safely
  let formattedDate = "Unknown Date";
  if (submission.submittedAt) {
    try {
      formattedDate = new Date(submission.submittedAt).toLocaleString();
    } catch (error) {
      formattedDate = "Invalid Date";
    }
  }

  const scoreColor = submission.score >= 70 ? "text-green-600" : 
                    submission.score >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="min-h-screen bg-background px-4">
        <header className="border-b">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/submitted-quizzes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Submissions
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Quiz Details</h1>
            </div>
            <span>Welcome, {user?.username}</span>
          </div>
        </header>

        <main className="container py-8">
          <div className="space-y-6">
            {/* Quiz Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{submission.quizTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Subject</p>
                    <p className="font-semibold">{submission.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chapter</p>
                    <p className="font-semibold">{submission.chapter}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className={`text-2xl font-bold ${scoreColor}`}>{submission.score}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Correct Answers</p>
                    <p className="text-2xl font-bold">{submission.correctAnswers}/{submission.totalQuestions}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Submitted At</p>
                    <p className="font-semibold">{formattedDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Summary */}
            {(submission.totalTimeSpent || submission.streakCorrect || submission.hintsUsed) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {submission.totalTimeSpent && (
                      <div>
                        <p className="text-sm text-muted-foreground">Total Time Spent</p>
                        <p className="text-lg font-semibold">{Math.floor(submission.totalTimeSpent / 60)}m {submission.totalTimeSpent % 60}s</p>
                      </div>
                    )}
                    {submission.averageTimePerQuestion && (
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Time per Question</p>
                        <p className="text-lg font-semibold">{Number(submission.averageTimePerQuestion).toFixed(1)}s</p>
                      </div>
                    )}
                    {submission.difficultyLevel && (
                      <div>
                        <p className="text-sm text-muted-foreground">Difficulty Level</p>
                        <p className={`text-lg font-semibold capitalize ${
                          submission.difficultyLevel === 'easy' ? 'text-green-600' :
                          submission.difficultyLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {submission.difficultyLevel}
                        </p>
                      </div>
                    )}
                    {submission.streakCorrect !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Best Correct Streak</p>
                        <p className="text-lg font-semibold text-green-600">{submission.streakCorrect}</p>
                      </div>
                    )}
                    {submission.firstAttemptCorrect !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">First Attempt Correct</p>
                        <p className="text-lg font-semibold">{submission.firstAttemptCorrect}/{submission.totalQuestions}</p>
                      </div>
                    )}
                    {submission.hintsUsed !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Hints Used</p>
                        <p className="text-lg font-semibold">{submission.hintsUsed}</p>
                      </div>
                    )}
                    {submission.confidenceScore && (
                      <div>
                        <p className="text-sm text-muted-foreground">Confidence Score</p>
                        <p className="text-lg font-semibold">{Number(submission.confidenceScore).toFixed(1)}/5</p>
                      </div>
                    )}
                    {submission.learningObjectiveMastery?.masteryLevel && (
                      <div>
                        <p className="text-sm text-muted-foreground">Mastery Level</p>
                        <p className={`text-lg font-semibold capitalize ${
                          submission.learningObjectiveMastery.masteryLevel === 'mastered' ? 'text-green-600' :
                          submission.learningObjectiveMastery.masteryLevel === 'proficient' ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {submission.learningObjectiveMastery.masteryLevel}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Question Analytics */}
            {submission.questionAnalytics && Array.isArray(submission.questionAnalytics) && submission.questionAnalytics.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Question-by-Question Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.questionAnalytics.map((analytics, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Question {analytics.questionIndex}</h4>
                          <div className="flex items-center gap-2">
                            {analytics.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-xs px-2 py-1 rounded ${
                              analytics.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              analytics.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {analytics.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Time Spent:</span>
                            <span className="ml-1 font-medium">{analytics.timeSpent}s</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Attempts:</span>
                            <span className="ml-1 font-medium">{analytics.attempts}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">First Attempt:</span>
                            <span className={`ml-1 font-medium ${analytics.isFirstAttemptCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {analytics.isFirstAttemptCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="ml-1 font-medium">{analytics.confidenceLevel}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Results */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Detailed Results</h2>
              {submission.submissionData && Array.isArray(submission.submissionData) && submission.submissionData.length > 0 ? (
                submission.submissionData.map((item, index) => (
                <Card key={index} className="rounded-lg shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Question {index + 1}
                      {item.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-lg text-gray-700">
                      <LatexRenderer content={item.question} />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Options:</h4>
                      {item.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border ${
                            option === item.correctAnswer
                              ? "bg-green-100 border-green-200"
                              : option === item.userAnswer && !item.isCorrect
                              ? "bg-red-100 border-red-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <LatexRenderer content={option} />
                            {option === item.correctAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                            )}
                            {option === item.userAnswer && !item.isCorrect && (
                              <XCircle className="h-4 w-4 text-red-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Your Answer:</p>
                        <p className={item.isCorrect ? "text-green-600" : "text-red-600"}>
                          <LatexRenderer content={item.userAnswer} />
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-muted-foreground">Correct Answer:</p>
                        <p className="text-green-600">
                          <LatexRenderer content={item.correctAnswer} />
                        </p>
                      </div>
                    </div>

                    {item.explanation && (
                      <Alert className="rounded-lg shadow-sm">
                        <AlertDescription>
                          <p className="font-medium mb-2 text-gray-800">Explanation:</p>
                          <div className="text-gray-700">
                            <LatexRenderer content={item.explanation} />
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No detailed results available for this submission.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </MathJaxContext>
  );
}