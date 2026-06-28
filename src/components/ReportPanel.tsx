import { useState } from "react";
import { ClipboardCheck, Download, ShieldCheck } from "lucide-react";
import type { AnalysisReport, RiskFinding } from "../types";
import { reportToMarkdown } from "../export/markdown";
import { copyTextToClipboard } from "../utils/clipboard";
import { ActionPlan } from "./ActionPlan";
import { Checklist } from "./Checklist";
import { ClauseEditPack } from "./ClauseEditPack";
import { PriorityBrief } from "./PriorityBrief";
import { RiskCard } from "./RiskCard";

interface ReportPanelProps {
  report: AnalysisReport;
  onCopyChecklist: () => Promise<boolean>;
  onCopyActionMessage: () => Promise<boolean>;
  onRevealEvidence?: (finding: RiskFinding) => void;
}

export function ReportPanel({ report, onCopyChecklist, onCopyActionMessage, onRevealEvidence }: ReportPanelProps) {
  const [copyReportState, setCopyReportState] = useState<"idle" | "copied" | "failed">("idle");
  const redCount = report.findings.filter((finding) => finding.severity === "red").length;
  const yellowCount = report.findings.filter((finding) => finding.severity === "yellow").length;
  const markdownReport = reportToMarkdown(report);

  async function copyReport() {
    setCopyReportState((await copyTextToClipboard(markdownReport)) ? "copied" : "failed");
  }

  function downloadMarkdown() {
    const blob = new Blob([markdownReport], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plaindoc-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="report-panel" aria-label="Analysis report">
      <div className="report-hero">
        <div>
          <p className="section-label">Report</p>
          <h2>{statusText(report.status)}</h2>
          <p>{report.summary}</p>
        </div>
        <div className="score-card" aria-label={`Risk reading score ${report.score}`}>
          <strong>{report.score}</strong>
          <span>阅读分</span>
        </div>
      </div>

      <div className="report-actions">
        <span>
          {redCount} 个红色风险 · {yellowCount} 个黄色提醒 · {report.wordCount} 字符线索 · {sourceText(report)}
        </span>
        <div className="report-action-buttons">
          <button className="ghost-button" type="button" onClick={copyReport}>
            <ClipboardCheck aria-hidden="true" />
            {copyReportLabel(copyReportState)}
          </button>
          <button className="ghost-button" type="button" onClick={downloadMarkdown}>
            <Download aria-hidden="true" />
            导出 Markdown
          </button>
        </div>
      </div>

      {report.notice ? <p className="report-notice">{report.notice}</p> : null}
      {copyReportState === "failed" ? (
        <div className="report-copy-fallback">
          <span>浏览器没有允许自动复制。可以在这里手动全选复制完整报告。</span>
          <textarea readOnly value={markdownReport} aria-label="完整 Markdown 报告" />
        </div>
      ) : null}

      <PriorityBrief report={report} />

      <section className="report-section">
        <p className="section-label">Risks</p>
        <h3>风险提示</h3>
        <div className="risk-list">
          {report.findings.length ? (
            report.findings.map((finding) => (
              <RiskCard key={finding.id} finding={finding} onRevealEvidence={onRevealEvidence} />
            ))
          ) : (
            <div className="quiet-state">
              <ShieldCheck aria-hidden="true" />
              <p>没有命中明显风险规则。请继续逐条确认金额、期限、违约和退出条件。</p>
            </div>
          )}
        </div>
      </section>

      <ClauseEditPack findings={report.findings} />

      <section className="report-section">
        <p className="section-label">Facts</p>
        <h3>关键事实</h3>
        {report.facts.length ? (
          <div className="facts-grid">
            {report.facts.map((fact, index) => (
              <article key={`${fact.label}-${index}`}>
                <span>{fact.label}</span>
                <p>{fact.value}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">还没有识别出足够的金额、日期或义务线索。</p>
        )}
      </section>

      <Checklist items={report.checklist} onCopy={onCopyChecklist} />

      <ActionPlan plan={report.actionPlan} onCopyMessage={onCopyActionMessage} />

      <section className="report-section plain-language">
        <p className="section-label">Plain Language</p>
        <h3>给普通人的解释</h3>
        {report.plainLanguage.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <p className="disclaimer">{report.disclaimer}</p>
    </section>
  );
}

function copyReportLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制报告";
}

function sourceText(report: AnalysisReport): string {
  if (report.source === "model") {
    return report.modelName ? `AI 增强：${report.modelName}` : "AI 增强";
  }
  return "本地规则";
}

function statusText(status: AnalysisReport["status"]): string {
  return {
    safe_to_review: "可以继续确认",
    needs_attention: "需要重点确认",
    do_not_sign_directly: "不建议直接签"
  }[status];
}
