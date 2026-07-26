import { describe, expect, it } from "vitest";
import type { Grant, Role, User } from "@/domain/user";
import { ROLES } from "@/domain/user";
import { ETCH01_CODE, LITHO01_CODE, LITHO02_CODE } from "@/data/fixtures/sections";
import {
  can,
  canEditPinTitle,
  canEnterSection,
  CAPABILITIES,
  type Capability,
  resolveRole,
} from "@/lib/permission";

/**
 * 這份表是 docs/permission-matrix.md 的可執行複本。
 * 兩者不一致時以文件為權威，並修這裡——不要反過來。
 */
const EXPECTED: Readonly<Record<Capability, Readonly<Record<Role, boolean>>>> = {
  "view.panes": { admin: true, editor: true, viewer: true },
  "file.download": { admin: true, editor: true, viewer: true },
  "copilot.ask": { admin: true, editor: true, viewer: true },
  "toolCommand.write": { admin: true, editor: true, viewer: true },
  "file.toggleCopilotRef": { admin: true, editor: true, viewer: false },
  "case.pack": { admin: true, editor: true, viewer: false },
  "pin.create": { admin: true, editor: true, viewer: false },
  "pin.editTitle": { admin: true, editor: true, viewer: false },
  "pin.promoteToCommon": { admin: true, editor: false, viewer: false },
  "fdc.feedbackVote": { admin: true, editor: true, viewer: false },
  "fdc.feedbackForm": { admin: true, editor: true, viewer: false },
  "tchart.annotate": { admin: true, editor: true, viewer: false },
  "graph.vote": { admin: true, editor: true, viewer: false },
  "graph.confirmPendingEdge": { admin: true, editor: true, viewer: false },
  "graph.addNode": { admin: true, editor: true, viewer: false },
  "settings.view": { admin: true, editor: true, viewer: true },
  "settings.editDos": { admin: true, editor: false, viewer: false },
  "settings.toggleMcp": { admin: true, editor: false, viewer: false },
  "settings.toggleLockedMcp": { admin: false, editor: false, viewer: false },
  "settings.expertTags": { admin: true, editor: false, viewer: false },
  "kmSource.add": { admin: true, editor: true, viewer: false },
  "kmSource.remove": { admin: true, editor: false, viewer: false },
  "grant.manage": { admin: true, editor: false, viewer: false },
};

const LAO_LI: User = {
  id: "u-laoli",
  name: "老李",
  sectionId: LITHO02_CODE,
  managerOf: [],
  supportSections: [LITHO01_CODE],
};

const MANAGER: User = {
  id: "u-manager",
  name: "課長",
  sectionId: LITHO02_CODE,
  managerOf: [LITHO02_CODE],
  supportSections: [],
};

const SPONSOR: User = {
  id: "u-sponsor",
  name: "Sponsor 老王",
  sectionId: "FAB-STAFF",
  managerOf: [],
  supportSections: [LITHO02_CODE],
};

const NOW = new Date("2026-07-24T00:00:00Z");

function grant(overrides: Partial<Grant> = {}): Grant {
  return {
    userId: SPONSOR.id,
    sectionId: LITHO02_CODE,
    role: "editor",
    grantedBy: MANAGER.id,
    grantedAt: new Date("2026-07-01T00:00:00Z"),
    expiresAt: null,
    ...overrides,
  };
}

describe("權限矩陣（23 功能 × 3 角色 = 69 個斷言）", () => {
  it("矩陣涵蓋所有 capability，沒有漏定義的", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...CAPABILITIES].sort());
  });

  for (const capability of CAPABILITIES) {
    for (const role of ROLES) {
      const expected = EXPECTED[capability][role];
      it(`${role} ${expected ? "可以" : "不可以"} ${capability}`, () => {
        expect(can(role, capability)).toBe(expected);
      });
    }
  }
});

describe("resolveRole：角色相對於課別", () => {
  it("該課 manager → admin", () => {
    expect(resolveRole(MANAGER, LITHO02_CODE, [], NOW)).toBe("admin");
  });

  it("該課工程師 → editor", () => {
    expect(resolveRole(LAO_LI, LITHO02_CODE, [], NOW)).toBe("editor");
  });

  it("同一人切到別課 → viewer（這是模型的重點）", () => {
    expect(resolveRole(MANAGER, LITHO02_CODE, [], NOW)).toBe("admin");
    expect(resolveRole(MANAGER, ETCH01_CODE, [], NOW)).toBe("viewer");
  });

  it("跨課支援的工程師 → viewer", () => {
    expect(resolveRole(LAO_LI, LITHO01_CODE, [], NOW)).toBe("viewer");
  });

  it("sponsor 預設 viewer，但可寫 Tool Command（部分放行）", () => {
    const role = resolveRole(SPONSOR, LITHO02_CODE, [], NOW);
    expect(role).toBe("viewer");
    expect(can(role, "toolCommand.write")).toBe(true);
    expect(can(role, "tchart.annotate")).toBe(false);
    expect(can(role, "fdc.feedbackVote")).toBe(false);
  });
});

describe("grant：admin 授予課外人員 editor", () => {
  it("授予後升為 editor", () => {
    expect(resolveRole(SPONSOR, LITHO02_CODE, [grant()], NOW)).toBe("editor");
  });

  it("撤銷（grant 移除）後降回 viewer", () => {
    expect(resolveRole(SPONSOR, LITHO02_CODE, [], NOW)).toBe("viewer");
  });

  it("expiresAt 過期後自動失效", () => {
    const expired = grant({ expiresAt: new Date("2026-07-23T00:00:00Z") });
    expect(resolveRole(SPONSOR, LITHO02_CODE, [expired], NOW)).toBe("viewer");
  });

  it("未過期的時效性 grant 仍有效", () => {
    const active = grant({ expiresAt: new Date("2026-07-25T00:00:00Z") });
    expect(resolveRole(SPONSOR, LITHO02_CODE, [active], NOW)).toBe("editor");
  });

  it("grant 只對指定課別生效，不會外溢到其他課", () => {
    expect(resolveRole(SPONSOR, ETCH01_CODE, [grant()], NOW)).toBe("viewer");
  });

  it("grant 授予後仍不能改專家標籤與移除 KM 來源（那是 admin-only）", () => {
    const role = resolveRole(SPONSOR, LITHO02_CODE, [grant()], NOW);
    expect(role).toBe("editor");
    expect(can(role, "settings.expertTags")).toBe(false);
    expect(can(role, "kmSource.remove")).toBe(false);
    expect(can(role, "grant.manage")).toBe(false);
  });
});

describe("canEnterSection：跨課需支援權限", () => {
  it("自己的課、管理的課、有支援權限的課都能進", () => {
    expect(canEnterSection(LAO_LI, LITHO02_CODE)).toBe(true);
    expect(canEnterSection(MANAGER, LITHO02_CODE)).toBe(true);
    expect(canEnterSection(LAO_LI, LITHO01_CODE)).toBe(true);
  });

  it("沒有支援權限的課別進不去", () => {
    expect(canEnterSection(LAO_LI, ETCH01_CODE)).toBe(false);
  });
});

describe("canEditPinTitle：editor 只能改自己的", () => {
  it("admin 可以改別人的", () => {
    expect(canEditPinTitle("admin", false)).toBe(true);
  });

  it("editor 只能改自己的", () => {
    expect(canEditPinTitle("editor", true)).toBe(true);
    expect(canEditPinTitle("editor", false)).toBe(false);
  });

  it("viewer 一律不能改", () => {
    expect(canEditPinTitle("viewer", true)).toBe(false);
  });
});
