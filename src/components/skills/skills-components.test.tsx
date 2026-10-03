import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkillPassScore } from "./skillpass-score";
import { SkillProgress } from "./skill-progress";
import { VerificationBadge } from "./verification-badge";

describe("SkillPassScore", () => {
  it("exposes the score to assistive technology", () => {
    render(<SkillPassScore score={87} verified />);
    expect(screen.getByRole("img", { name: "Score SkillPass : 87 sur 100" })).toBeInTheDocument();
    expect(screen.getByText("Vérifié")).toBeInTheDocument();
  });
});

describe("SkillProgress", () => {
  it("shows the derived level label", () => {
    render(<SkillProgress name="Power Apps" score={95} />);
    expect(screen.getByText(/Expert/)).toBeInTheDocument();
  });
});

describe("VerificationBadge", () => {
  it("renders the French status label", () => {
    render(<VerificationBadge status="PENDING" />);
    expect(screen.getByText("En cours de vérification")).toBeInTheDocument();
  });
});
