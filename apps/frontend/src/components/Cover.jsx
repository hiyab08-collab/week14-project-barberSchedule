import AuthForm from "./AuthForm.jsx";

function ScissorsMark() {
  return (
    <svg
      className="hero-mark"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="16"
        cy="16"
        r="8"
        stroke="var(--accent-gold)"
        strokeWidth="3"
      />
      <circle
        cx="16"
        cy="48"
        r="8"
        stroke="var(--accent-gold)"
        strokeWidth="3"
      />
      <line
        x1="22"
        y1="21"
        x2="54"
        y2="48"
        stroke="var(--accent-gold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="22"
        y1="43"
        x2="54"
        y2="16"
        stroke="var(--accent-gold)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Cover({ onAuthSuccess }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <ScissorsMark />
        <p className="eyebrow">Est. this semester</p>
        <h1 className="wordmark">
          SlicedBy<span className="wordmark-accent">_N10</span>
        </h1>
        <span className="wordmark-rule" />
        <p>
          The only line you'll wait in is the one on your fade. Book it. Sit
          down. Look sharp. No small talk. Just sharp results. Your next cut is
          one tap away.
        </p>
      </div>

      <AuthForm onAuthSuccess={onAuthSuccess} />
    </section>
  );
}
