"use client";
import { useState } from "react";
import { joinWaitlist } from "@/lib/api";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

export function ServerFullPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    try {
      await joinWaitlist(email);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#00214d",
        fontFamily: FONT,
      }}
    >
      <div style={{ maxWidth: 480, textAlign: "center", padding: 32 }}>
        <h1
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#5af78e",
            margin: "0 0 12px",
            letterSpacing: "0.08em",
          }}
        >
          PIPEWAR
        </h1>

        <div
          style={{
            fontSize: 14,
            color: "#ff6b6b",
            margin: "24px 0 8px",
            fontWeight: "bold",
          }}
        >
          SERVER AT CAPACITY
        </div>

        <p
          style={{
            fontSize: 11,
            color: "#a0b0c0",
            margin: "0 0 24px",
            lineHeight: 1.8,
          }}
        >
          PIPEWAR is a small indie game and way more people showed up
          than we expected. We&apos;re working on scaling up.
          <br />
          <br />
          Leave your email and we&apos;ll notify you when a spot opens up.
        </p>

        {status === "done" ? (
          <div style={{ fontSize: 12, color: "#5af78e" }}>
            You&apos;re on the list. We&apos;ll be in touch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: 240,
                height: 38,
                background: "#001a3a",
                border: "1px solid #1a3a5c",
                color: "#c0c0c0",
                fontSize: 12,
                fontFamily: FONT,
                padding: "0 12px",
                borderRadius: 3,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                height: 38,
                padding: "0 16px",
                background: "transparent",
                border: "1px solid #5af78e",
                color: "#5af78e",
                fontSize: 11,
                fontWeight: "bold",
                fontFamily: FONT,
                cursor: status === "submitting" ? "wait" : "pointer",
                borderRadius: 3,
                letterSpacing: "0.05em",
              }}
            >
              {status === "submitting" ? "..." : "NOTIFY ME"}
            </button>
          </form>
        )}

        {status === "error" && (
          <div style={{ fontSize: 11, color: "#ff6b6b", marginTop: 8 }}>
            Something went wrong. Try again.
          </div>
        )}

        <div style={{ marginTop: 32, fontSize: 9, color: "#5a7a9a" }}>
          Try refreshing in a few minutes — spots free up as games finish.
        </div>
      </div>
    </div>
  );
}
