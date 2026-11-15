(() => {
  "use strict";
  const REPO = "boooter316/github.test1";
  const ZIP = "https://github.com/" + REPO + "/archive/refs/heads/main.zip";
  const API = "https://api.github.com/repos/" + REPO;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const css = document.createElement("style");
  css.textContent = ".workspace-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px;margin:12px 0 16px;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:rgba(15,23,42,.82)}.workspace-actions button{min-height:42px;padding:9px 13px;border:0;border-radius:9px;font:600 14px system-ui;cursor:pointer;background:#2563eb;color:white}.workspace-actions button.stop{background:#991b1b}.workspace-actions button.download{background:#166534}.workspace-actions button.build{background:#475569}.workspace-actions .action-status{flex-basis:100%;font-size:12px;color:inherit;opacity:.9;overflow-wrap:anywhere}.workspace-actions button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}@media(max-width:560px){.workspace-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.workspace-actions button{width:100%;min-height:46px}.workspace-actions .action-status{grid-column:1/-1}}";
  document.head.appendChild(css);

  function tabTitle(panel) {
    const label = panel.getAttribute("aria-label") || panel.getAttribute("aria-labelledby");
    if (label) {
      const el = document.getElementById(label);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    const heading = panel.querySelector(":scope > h1,:scope > h2,:scope > h3,:scope > header h1,:scope > header h2");
    return (heading && heading.textContent.trim()) || panel.getAttribute("aria-label") || panel.id || document.title || "Workspace";
  }

  function makeControls(panel) {
    if (panel.dataset.workspaceActions === "1" || panel.closest(".workspace-actions")) return;
    panel.dataset.workspaceActions = "1";
    const bar = document.createElement("div");
    bar.className = "workspace-actions";
    bar.setAttribute("aria-label", "Workspace actions");
    const status = document.createElement("span");
    status.className = "action-status";
    status.setAttribute("role", "status");
    status.textContent = "Actions for " + tabTitle(panel) + ". Build is available only when this tab contains a project builder.";
    const stop = document.createElement("button");
    stop.type = "button"; stop.className = "stop"; stop.textContent = "Stop";
    stop.addEventListener("click", () => {
      window.workspaceStopRequested = true;
      try {
        const globalStop = document.getElementById("globalStopButton");
        if (globalStop && !globalStop.disabled) globalStop.click();
        else {
          document.dispatchEvent(new CustomEvent("workspace:stop", {bubbles:true}));
          if (window.recoveryTaskController && typeof window.recoveryTaskController.abort === "function") window.recoveryTaskController.abort();
          if (typeof window.stopCurrentWorkspaceTask === "function") window.stopCurrentWorkspaceTask();
        }
        status.textContent = "Stop requested. Only tasks that support cancellation can be interrupted.";
      } catch (e) { status.textContent = "Stop request could not be completed: " + e.message; }
    });

    const upgrade = document.createElement("button");
    upgrade.type = "button"; upgrade.textContent = "Check for updates";
    upgrade.addEventListener("click", () => {
      status.textContent = "This repository is private, so the browser cannot reliably query its GitHub API without your sign-in. Open the signed-in GitHub pages below to review the latest commits, releases, or source ZIP.";
      bar.querySelectorAll("[data-update-link]").forEach(el => el.remove());
      const links = [
        ["View latest commits", "https://github.com/" + REPO + "/commits/main/"],
        ["View releases", "https://github.com/" + REPO + "/releases"],
        ["Download main ZIP", ZIP]
      ];
      links.forEach(([label, href]) => {
        const a = document.createElement("a");
        a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.textContent = label; a.dataset.updateLink = "1";
        a.style.cssText = "color:#93c5fd;margin-right:12px;display:inline-block";
        bar.appendChild(a);
      });
    });;

    const build = document.createElement("button");
    build.type = "button"; build.className = "build"; build.textContent = "Build";
    build.addEventListener("click", () => {
      const candidates = [...panel.querySelectorAll("button,input[type=button],input[type=submit]")].filter(el => el !== stop && el !== upgrade && el !== build && !el.closest(".workspace-actions") && !el.closest(".hidden,[hidden]") && el.closest('[id$="Tab"],[id$="TabPanel"],[role="tabpanel"],.tab-panel,.pane') === panel);
      const target = candidates.find(el => /build|compile|package|create executable/i.test((el.textContent || el.value || el.getAttribute("aria-label") || "").trim()) && !el.disabled);
      if (target) { status.textContent = "Starting the existing builder: " + (target.textContent || target.value || "Build") + "."; target.click(); }
      else status.textContent = "No build operation is defined for this tab. Use Build in the project builder or the GitHub Actions workflow for supported builds.";
    });

    const download = document.createElement("button");
    download.type = "button"; download.className = "download"; download.textContent = "Download this tab";
    download.addEventListener("click", () => {
      const clone = panel.cloneNode(true);
      clone.querySelectorAll(".workspace-actions").forEach(el => el.remove());
      clone.querySelectorAll("script").forEach(el => el.remove());
      const doc = "<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + esc(tabTitle(panel)) + "</title></head><body>" + clone.outerHTML + "</body></html>";
      const blob = new Blob([doc], {type:"text/html;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=(panel.id || "workspace") + ".html"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      status.textContent = "Downloaded a standalone HTML snapshot of this tab. Interactive app functions and server-side features are not included in the snapshot.";
    });

    const diagnostics = document.createElement("button");
    diagnostics.type = "button"; diagnostics.textContent = "Export diagnostics";
    diagnostics.addEventListener("click", () => {
      const report = {
        generatedAt: new Date().toISOString(),
        page: location.origin + location.pathname,
        title: document.title,
        activeWorkspace: tabTitle(panel),
        panelId: panel.id || null,
        counts: {
          tabs: document.querySelectorAll('[role="tab"]').length,
          tabPanels: document.querySelectorAll('[role="tabpanel"],[id$="Tab"],[id$="TabPanel"],.tab-panel,.pane').length,
          buttons: document.querySelectorAll("button").length,
          links: document.querySelectorAll("a[href]").length,
          scripts: document.scripts.length
        },
        note: "This report intentionally excludes form values, cookies, local storage, tokens, and page text."
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], {type:"application/json;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download="workspace-diagnostics.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      status.textContent = "Downloaded a privacy-conscious diagnostics report. It does not include form values, cookies, local storage, or tokens.";
    });

    const buildStatus = document.createElement("button");
    buildStatus.type = "button"; buildStatus.textContent = "Build status";
    buildStatus.addEventListener("click", () => {
      window.open("https://github.com/" + REPO + "/actions", "_blank", "noopener,noreferrer");
      status.textContent = "Opened the repository's GitHub Actions page. Sign in to view private build logs and artifacts.";
    });

    bar.append(stop, upgrade, build, download, diagnostics, buildStatus, status);
    panel.appendChild(bar);
  }

  function scan() {
    const selectors = [
      '[id$="Tab"]', '[id$="TabPanel"]', '[role="tabpanel"]', '.tab-panel', '.pane'
    ];
    document.querySelectorAll(selectors.join(",")).forEach(panel => {
      if (panel instanceof HTMLElement && panel.id !== "accountServiceTabs" && panel.id !== "accountServicePanels") makeControls(panel);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan, {once:true}); else scan();
  new MutationObserver(scan).observe(document.documentElement, {childList:true,subtree:true});
})();