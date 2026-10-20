import { describe, expect, it } from "vitest";
import { projects, type Project } from "@/content/projects";
import { shownLinks } from "./projects";

const base = projects[0] as Project;
const withLive = (liveCheck: Project["liveCheck"]): Project => ({
  ...base,
  links: { github: "https://github.com/x/y", live: "https://example.test" },
  liveCheck,
});

describe("shownLinks", () => {
  it("shows a live app only while its last check passed", () => {
    expect(shownLinks(withLive({ date: "2026-10-19", ok: true, note: "" })).live).toBe(
      "https://example.test",
    );
    expect(shownLinks(withLive({ date: "2026-10-19", ok: false, note: "" })).live).toBeUndefined();
  });

  it("hides a live app that was never checked", () => {
    expect(shownLinks(withLive(undefined)).live).toBeUndefined();
  });

  it("keeps every other link", () => {
    expect(shownLinks(withLive(undefined)).github).toBe("https://github.com/x/y");
  });
});
