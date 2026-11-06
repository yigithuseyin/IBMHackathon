import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/",            icon: "🏠", label: "Home"        },
  { to: "/leaderboard", icon: "🏆", label: "Ranks"       },
  { to: "/profile",     icon: "🤖", label: "Profile"     },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
