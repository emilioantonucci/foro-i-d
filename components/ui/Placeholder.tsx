export default function Placeholder({
  title,
  desc,
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div>
      <h1
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "22px",
          margin: "0 0 4px",
          color: "#262626",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "#737373", fontSize: "14px", margin: "0 0 22px" }}>
        {desc ?? "Pantalla del MVP — se conecta a datos reales en el siguiente paso."}
      </p>
      <div
        style={{
          background: "#fff",
          border: "1px dashed #D4D4D4",
          borderRadius: "14px",
          padding: "48px 32px",
          textAlign: "center",
          color: "#AAAAB4",
          fontSize: "13px",
        }}
      >
        En construcción
      </div>
    </div>
  );
}
