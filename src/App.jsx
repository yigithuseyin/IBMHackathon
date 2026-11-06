import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import AskEv from "./components/AskEv";
import Home from "./pages/Home";
import Household from "./pages/Household";
import CreateHousehold from "./pages/CreateHousehold";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/"                      element={<Home />} />
          <Route path="/household/:id"         element={<Household />} />
          <Route path="/create-household"      element={<CreateHousehold />} />
          <Route path="/leaderboard"           element={<Leaderboard />} />
          <Route path="/profile"               element={<Profile />} />
        </Routes>
        <BottomNav />
        <AskEv />
      </div>
    </BrowserRouter>
  );
}
