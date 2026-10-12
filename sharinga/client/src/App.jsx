import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DisplayProvider } from "./context/DisplayContext";
import Spinner from "./components/ui/Spinner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Lobby from "./pages/Lobby";
import Chat from "./components/chat/Chat";
import Settings from "./pages/Settings";
import { Logo } from "./components/ui/Logo";

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <Spinner label="Loading your account…" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <DisplayProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/lobby"
              element={
                <Protected>
                  <Lobby />
                </Protected>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <Protected>
                  <Chat />
                </Protected>
              }
            />
            <Route
              path="/settings"
              element={
                <Protected>
                  <Settings />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DisplayProvider>
  );
}
