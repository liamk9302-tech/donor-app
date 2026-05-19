"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [donation, setDonation] = useState("");
  const [campaign, setCampaign] = useState("");
  const [notes, setNotes] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateEmail(e: any) {
    e.preventDefault();

    setLoading(true);
    setResponse("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        donation,
        campaign,
        notes
      })
    });

    const data = await res.json();

    setResponse(data.text);
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "white",
        padding: "40px",
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
        GoodCircle
      </h1>

      <p style={{ marginBottom: "30px", color: "#aaa" }}>
        AI-powered nonprofit donor acknowledgments
      </p>

      <form
        onSubmit={generateEmail}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "600px"
        }}
      >
        <input
          placeholder="Donor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Donation Amount"
          value={donation}
          onChange={(e) => setDonation(e.target.value)}
        />

        <input
          placeholder="Campaign"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        />

        <textarea
          placeholder="Staff Notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="submit"
          style={{
            background: "white",
            color: "black",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          {loading ? "Generating..." : "Generate Acknowledgment"}
        </button>
      </form>

      {response && (
        <div
          style={{
            marginTop: "40px",
            background: "#222",
            padding: "20px",
            borderRadius: "10px",
            whiteSpace: "pre-wrap",
            maxWidth: "700px"
          }}
        >
          {response}
        </div>
      )}
    </main>
  );
}