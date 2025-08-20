import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import CreateQuiz from "@/pages/create-quiz";
import TakeQuiz from "@/pages/take-quiz";
import SubmittedQuizzesPage from "@/pages/submitted-quizzes";
import QuizSubmissionDetailPage from "@/pages/quiz-submission-detail";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/take" component={TakeQuiz} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/create" component={CreateQuiz} />
      <ProtectedRoute path="/submitted-quizzes" component={SubmittedQuizzesPage} />
      <ProtectedRoute path="/submitted-quizzes/:id" component={QuizSubmissionDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
