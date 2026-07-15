import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { AuthView } from "./features/auth/AuthView";
import { Dashboard } from "./components/Dashboard";

function AppContent() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="loading-screen">
        <div className="spinner" aria-hidden="true" />
        <span>Loading workspace</span>
      </main>
    );
  }

  return token ? <Dashboard /> : <AuthView />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

