import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Spinner from "./components/common/Spinner.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import MyRoutes from "./pages/MyRoutes.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import Matches from "./pages/Matches.jsx";
import MyRides from "./pages/MyRides.jsx";
import RideDetail from "./pages/RideDetail.jsx";
import Wallet from "./pages/Wallet.jsx";
import Profile from "./pages/Profile.jsx";
import Notifications from "./pages/Notifications.jsx";
import Safety from "./pages/Safety.jsx";
import NotFound from "./pages/NotFound.jsx";

function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}


export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<Protected />}>
          <Route path="/" element={<Home />} />
          <Route path="/routes" element={<MyRoutes />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/rides" element={<MyRides />} />
          <Route path="/rides/:id" element={<RideDetail />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/safety" element={<Safety />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
