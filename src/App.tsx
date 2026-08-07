import Dashboard from "./components/Dashboard";
import { InventoryProvider } from "./context/InventoryContext";
import { version } from "../package.json";

export default function App() {
  return (
    <InventoryProvider>
      <Dashboard />
      <footer className="app-footer">inv v{version}</footer>
    </InventoryProvider>
  );
}
