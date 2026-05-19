export default function Home() {
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
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "600px"
        }}
      >
        <input placeholder="Donor Name" />
        <input placeholder="Donation Amount" />
        <input placeholder="Campaign" />
        <textarea placeholder="Staff Notes" rows={5} />

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
          Generate Acknowledgment
        </button>
      </form>
    </main>
  );
}