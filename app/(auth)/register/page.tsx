"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthResult } from "../actions";

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

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

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
        Sumate al equipo
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
        Crear cuenta
      </h1>
      <p style={{ fontSize: "14px", color: "#737373", margin: "0 0 22px" }}>
        Registrate como colaborador para publicar, debatir y priorizar señales de I+D.
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
      {state.success && (
        <div
          role="status"
          style={{
            background: "#F1F7DC",
            border: "1px solid #CDE08C",
            color: "#38761D",
            fontSize: "13px",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "16px",
          }}
        >
          {state.success}
        </div>
      )}

      <div style={fieldWrap}>
        <label htmlFor="nombre" style={labelStyle}>
          Nombre del colaborador
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          required
          placeholder="Nombre y apellido"
          style={inputStyle}
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          style={inputStyle}
        />
      </div>

      <div style={fieldWrap}>
        <label htmlFor="confirm" style={labelStyle}>
          Confirmar contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repetí la contraseña"
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
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p style={{ fontSize: "13px", color: "#737373", textAlign: "center", marginTop: "18px", marginBottom: 0 }}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" style={{ color: "#6b9000", fontWeight: 700 }}>
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
