// Static official-contact strip. Informational only: no live status claimed.
export default function EmergencyStrip() {
  return (
    <section className="ir-emergency" aria-labelledby="sos-title">
      <h2 id="sos-title">🚨 Emergency &amp; Contacts</h2>
      <p className="ir-sub" style={{ color: "#bfe6e3", margin: 0 }}>
        In immediate danger, call first — don&apos;t rely solely on this app.
      </p>
      <div className="ir-sos">
        <div><strong>🚑 Emergency — 911</strong>Fire / Police / Ambulance</div>
        <div><strong>📞 NEMO — 452-3802</strong>St. Lucia Emergency Mgmt</div>
        <div><strong>🏥 Castries Hospital</strong>758-458-6700</div>
        <div><strong>🤝 Red Cross SLU</strong>758-452-5583</div>
      </div>
      <p style={{ fontSize: "0.85rem", margin: "0.2rem 0 0" }}>
        Shelter list: refer to the official NEMO shelter list (static guidance in this phase).
      </p>
    </section>
  );
}
