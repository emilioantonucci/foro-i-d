"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthResult } from "../actions";

const initial: AuthResult = {};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E8E8E8",
  borderRadius: "16px",
  padding: "32px 30px",
  boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 12px 32px rgba(0,0,0,.05)",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 700,
  color: "#404040",
  marginBottom: "6px",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1px solid #E0DED9",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#262626",
  background: "#fff",
  outline: "none",
};
const fieldWrap: React.CSSProperties = { marginBottom: "16px" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <form action={formAction} style={cardStyle}>
      <div
        style={{
          fontSize: "11px",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "#6b9000",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Acceso al radar
      </div>
      <h1
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "24px",
          margin: "0 0 6px",
          color: "#262626",
          letterSpacing: "-0.01em",
        }}
      >
        Iniciar sesión
      </h1>
      <p style={{ fontSize: "14px", color: "#737373", margin: "0 0 22px" }}>
        Accedé a tu inteligencia colectiva de Investigación y Desarrollo.
      </p>

      {state.error && (
        <div
          role="alert"
          style={{
            background: "#FBEAEA",
            border: "1px solid #E9B7B8",
            color: "#980000",
            fontSize: "13px",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "16px",
          }}
        >
          {state.error}
        </div>
      )}

      <div style={fieldWrap}>
        <label htmlFor="email" style={labelStyle}>
          Email corporativo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="nombre@doinglobal.com"
          style={inputStyle}
        />
      </div>

      <div style={fieldWrap}>
        <label htmlFor="password" style={labelStyle}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>

      <button
        type="submit"
        className="dg-btn dg-btn--primary"
        disabled={pending}
        style={{
          width: "100%",
          justifyContent: "center",
          marginTop: "6px",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>

      <p style={{ fontSize: "13px", color: "#737373", textAlign: "center", marginTop: "18px", marginBottom: 0 }}>
        ¿No tenés cuenta?{" "}
        <Link href="/register" style={{ color: "#6b9000", fontWeight: 700 }}>
          Registrate
        </Link>
      </p>
    </form>
  );
}
