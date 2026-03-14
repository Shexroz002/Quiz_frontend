import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SelectSubjectsPage } from "./pages/SelectSubjectsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DashboardTeacherPage } from "./pages/DashboardTeacherPage";
import { StatisticTeacherPage } from "./pages/StatisticTeacherPage";
import { CreateTestPage } from "./pages/CreateTestPage";
import { AITestPage } from "./pages/AITestPage";
import { PDFTestPage } from "./pages/PDFTestPage";
import { CompetitionWaitingPage } from "./pages/CompetitionWaitingPage";
import { TestTakingPage } from "./pages/TestTakingPage";
import { QuestionMapPage } from "./pages/QuestionMapPage";
import { TestResultsPage } from "./pages/TestResultsPage";
import { FriendsPage } from "./pages/FriendsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { StatisticPage } from "./pages/StatisticPage";
import { ErrorPage } from "./pages/ErrorPage";
import { ErrorAnalysisPage } from "./pages/ErrorAnalysisPage";
import { TestsListPage } from "./pages/TestsListPage";
import { EditTestPage } from "./pages/EditTestPage";
import { EditQuestionPage } from "./pages/EditQuestionPage";
import { TestDetailPage } from "./pages/TestDetailPage";
import { QuestionDetailPage } from "./pages/QuestionDetailPage";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { NotificationPage } from "./pages/NotificationPage";
import { NatijalarPage } from "./pages/NatijalarPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { TopicStatisticPage } from "./pages/TopicStatisticPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
    errorElement: <ErrorPage />,
  },
  {
    path: "/register",
    Component: RegisterPage,
    errorElement: <ErrorPage />,
  },
  {
    Component: ProtectedRoute,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/select-subjects",
        Component: SelectSubjectsPage,
      },
      {
        path: "/",
        Component: DashboardPage,
      },
      {
        path: "/dashboard-teacher",
        Component: DashboardTeacherPage,
      },
      {
        path: "/statistic-teacher",
        Component: StatisticTeacherPage,
      },
      {
        path: "/create-test",
        Component: CreateTestPage,
      },
      {
        path: "/ai-test",
        Component: AITestPage,
      },
      {
        path: "/pdf-test",
        Component: PDFTestPage,
      },
      {
        path: "/competition",
        Component: CompetitionWaitingPage,
      },
      {
        path: "/test-taking",
        Component: TestTakingPage,
      },
      {
        path: "/question-map",
        Component: QuestionMapPage,
      },
      {
        path: "/test-results",
        Component: TestResultsPage,
      },
      {
        path: "/friends",
        Component: FriendsPage,
      },
      {
        path: "/profile",
        Component: ProfilePage,
      },
      {
        path: "/statistic",
        Component: StatisticPage,
      },
      {
        path: "/error-analysis",
        Component: ErrorAnalysisPage,
      },
      {
        path: "/tests-list",
        Component: TestsListPage,
      },
      {
        path: "/edit-test",
        Component: EditTestPage,
      },
      {
        path: "/test-detail",
        Component: TestDetailPage,
      },
      {
        path: "/question-detail",
        Component: QuestionDetailPage,
      },
      {
        path: "/edit-question",
        Component: EditQuestionPage,
      },
      {
        path: "/create-room",
        Component: CreateRoomPage,
      },
      {
        path: "/notifications",
        Component: NotificationPage,
      },
      {
        path: "/natijalar",
        Component: NatijalarPage,
      },
      {
        path: "/topic-statistic",
        Component: TopicStatisticPage,
        errorElement: <ErrorPage />,
      },
    ],
  },
  {
    path: "*",
    Component: ErrorPage,
  },
]);
