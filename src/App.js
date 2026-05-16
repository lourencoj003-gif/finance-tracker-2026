import { useState, useCallback } from "react";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import Dashboard from "./components/Dashboard";
import SectionTable from "./components/SectionTable";
import SettingsTab from "./components/SettingsTab";
import AIAdvisor from "./components/AIAdvisor";

const TABS = ["Dashboard", "Income", "Expenses", "Investments", "Settings", "Advisor"];

const INITIAL_SEMI_MOS = [5, 11];
const INITIAL_SEMI_AMT = 150;

const INITIAL_DATA = {
  income: {
    "Salary":       [1192.24, 1192.24, 1192.24, 1192.24, 1243.04, 1473, 1650, 1650, 1650, 1650, 1650, 1650],
    "Freelance":    Array(12).fill(0),
    "Other Income": Array(12).fill(0),
  },
  expenses: {
    "Housing":         Array(12).fill(0),
    "Food":            Array(12).fill(100),
    "Transport":       Array(12).fill(32),
    "Entertainment":   [30, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    "Clothing":        Array(12).fill(150),
    "Health":          Array(12).fill(0),
    "Monthly Sub":     Array(12).fill(58),
    "Semi-Annual Sub": [0, 0, 0, 0, 78, 0, 0, 78, 0, 0, 78, 0],
    "Date Night":      Array(12).fill(300),
    "Other":           Array(12).fill(0),
  },
  investments: {
    "ISA":            Array(12).fill(0),
    "Pension":        Array(12).fill(0),
    "Stocks":         Array(12).fill(0),
    "Emergency Fund": Array(12).fill(0),
    "Crypto":         Array(12).fill(0),
  },
};

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState(0);
  const [semiMos, setSemiMos] = useState(INITIAL_SEMI_MOS);
  const [semiAmt, setSemiAmt] = useState(INITIAL_SEMI_AMT);

  const handleUpdate = useCallback((section, rowName, monthIdx, value) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [rowName]: prev[section][rowName].map((v, i) => i === monthIdx ? value : v),
      },
    }));
  }, []);

  const handleAddRow = useCallback((section, rowName) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [rowName]: Array(12).fill(0) },
    }));
  }, []);

  const handleDeleteRow = useCallback((section, rowName) => {
    setData(prev => {
      const next = { ...prev[section] };
      delete next[rowName];
      return { ...prev, [section]: next };
    });
  }, []);

  const handleRenameRow = useCallback((section, oldName, newName) => {
    setData(prev => {
      const entries = Object.entries(prev[section]);
      const renamed = entries.map(([k, v]) => [k === oldName ? newName : k, v]);
      return { ...prev, [section]: Object.fromEntries(renamed) };
    });
  }, []);

  const tableProps = (section, headerBg) => ({
    section,
    data,
    onUpdate: handleUpdate,
    onAddRow: handleAddRow,
    onDeleteRow: handleDeleteRow,
    onRenameRow: handleRenameRow,
    headerBg,
  });

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "100vh", background: "#f5f7fa" }}>
      <Header data={data} />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 8px" }}>
        {activeTab === 0 && <Dashboard data={data} />}
        {activeTab === 1 && <SectionTable title="Income"      {...tableProps("income",      "#e8f5e9")} />}
        {activeTab === 2 && <SectionTable title="Expenses"    {...tableProps("expenses",    "#fce4e4")} semiMos={semiMos} />}
        {activeTab === 3 && <SectionTable title="Investments" {...tableProps("investments", "#e3f2fd")} />}
        {activeTab === 4 && (
          <SettingsTab
            semiMos={semiMos}
            setSemiMos={setSemiMos}
            semiAmt={semiAmt}
            setSemiAmt={setSemiAmt}
          />
        )}
        {activeTab === 5 && <AIAdvisor data={data} />}
      </div>
    </div>
  );
}
