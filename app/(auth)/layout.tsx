/* eslint-disable @next/next/no-img-element */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F4F2",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "22px",
            justifyContent: "center",
          }}
        >
          <img
            src="/assets/logo-primary.png"
            alt="doinGlobal"
            style={{ height: "26px", width: "auto" }}
          />
          <span style={{ width: "1px", height: "24px", background: "#C9C7C2" }} />
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "-0.01em",
              color: "#262626",
            }}
          >
            I+D Hub
          </span>
        </div>
        {children}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "12px",
            color: "#AAAAB4",
          }}
        >
          Sistema interno de inteligencia colectiva para I+D · doinGlobal
        </p>
      </div>
    </div>
  );
}
