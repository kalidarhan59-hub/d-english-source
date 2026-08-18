import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Journey from "@/pages/Journey";
import Lesson from "@/pages/Lesson";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import { Route, Switch } from "wouter";
import { AppShell } from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function LearningRoute({ component: Component }: { component: React.ComponentType }) {
  return <AppShell><Component /></AppShell>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">{() => <LearningRoute component={Dashboard} />}</Route>
      <Route path="/journey">{() => <LearningRoute component={Journey} />}</Route>
      <Route path="/lesson/:id">{() => <LearningRoute component={Lesson} />}</Route>
      <Route path="/profile">{() => <LearningRoute component={Profile} />}</Route>
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
