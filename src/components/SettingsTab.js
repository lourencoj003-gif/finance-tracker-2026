export default function SettingsTab() {
  return (
    <div style={{ background:"#fff", borderRadius:8, boxShadow:"0 1px 4px #0001", padding:24, maxWidth:600 }}>
      <div style={{ fontWeight:700, fontSize:16, color:"#1a3a5c", marginBottom:16 }}>Settings</div>
      <div style={{ color:"#666", fontSize:14, lineHeight:1.6 }}>
        <p>This finance tracker stores all data in your browser session.</p>
        <p style={{ marginTop:12 }}><strong>Tips:</strong></p>
        <ul style={{ marginTop:6, paddingLeft:20, display:"flex", flexDirection:"column", gap:6 }}>
          <li>Go to <strong>Income</strong>, <strong>Expenses</strong>, or <strong>Investments</strong> tabs to edit values.</li>
          <li>Double-click a category name to rename it.</li>
          <li>Click <strong>+ Add</strong> to add a new category row.</li>
          <li>Click <strong>×</strong> to delete a row.</li>
          <li>The <strong>Overview</strong> tab shows your annual summary and monthly net chart.</li>
          <li>The <strong>AI Advisor</strong> tab gives personalised insights based on your data.</li>
        </ul>
      </div>
    </div>
  );
}
