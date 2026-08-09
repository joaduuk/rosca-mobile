import { AuthProvider } from "./src/auth/AuthContext";
import { NotificationProvider } from "./src/notifications/NotificationContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RootNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}