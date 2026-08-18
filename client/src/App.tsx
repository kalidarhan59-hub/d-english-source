import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Academy from "@/pages/Academy";
import Assessment from "@/pages/Assessment";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Journey from "@/pages/Journey";
import Lesson from "@/pages/Lesson";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/academy" component={Academy} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Academy} />
      <Route path="/journey" component={Journey} />
      <Route path="/lesson/:id" component={Lesson} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
