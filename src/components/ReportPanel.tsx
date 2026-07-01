import { forwardRef, useEffect, useRef, useState } from "react";
import { ClipboardCheck, Download, Printer, ShieldCheck } from "lucide-react";
import type { AnalysisReport, RiskFinding } from "../types";
import { downloadMarkdownFile } from "../export/downloadMarkdown";
import { buildReportMarkdownFilename } from "../export/downloadFilename";
import { reportToMarkdown } from "../export/markdown";
import { printReport } from "../export/printReport";
import { copyTextToClipboard } from "../utils/clipboard";
import { formatTextScale } from "../report/textScale";
import { getCoverageBoundaryNotice } from "../report/coverageBoundary";
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

export const ReportPanel = forwardRef<HTMLElement, ReportPanelProps>(function ReportPanel(
  { report, onCopyChecklist, onCopyActionMessage, onRevealEvidence },
  ref
) {
  const [copyReportState, setCopyReportState] = useState<"idle" | "copied" | "failed">("idle");
  const [downloadReportState, setDownloadReportState] = useState<"idle" | "downloaded" | "failed">("idle");
  const [printState, setPrintState] = useState<"idle" | "failed">("idle");
  const copyFallbackRef = useRef<HTMLTextAreaElement>(null);
  const downloadFallbackRef = useRef<HTMLTextAreaElement>(null);
  const redCount = report.findings.filter((finding) => finding.severity === "red").length;
  const yellowCount = report.findings.filter((finding) => finding.severity === "yellow").length;
  const markdownReport = reportToMarkdown(report);
  const coverageBoundaryNotice = getCoverageBoundaryNotice(report);

  useEffect(() => {
    setCopyReportState("idle");
    setDownloadReportState("idle");
    setPrintState("idle");
  }, [markdownReport]);

  useEffect(() => {
    if (copyReportState === "failed") {
      selectFallbackText(copyFallbackRef.current);
    }
  }, [copyReportState]);

  useEffect(() => {
    if (downloadReportState === "failed") {
      selectFallbackText(downloadFallbackRef.current);
    }
  }, [downloadReportState]);

  async function copyReport() {
    setCopyReportState((await copyTextToClipboard(markdownReport)) ? "copied" : "failed");
  }

  function downloadMarkdown() {
    setDownloadReportState(
      downloadMarkdownFile(markdownReport, buildReportMarkdownFilename(report)) ? "downloaded" : "failed"
    );
  }

  function printCurrentReport() {
    setPrintState(printReport() ? "idle" : "failed");
  }

  return (
    <section id="report-panel" className="report-panel" aria-label="分析报告" tabIndex={-1} ref={ref}>
      <div className="report-hero">
        <div>
          <p className="section-label">报告</p>
          <h2>{statusText(report.status)}</h2>
          <p>{report.summary}</p>
        </div>
        <div className="score-card" aria-label={`风险阅读分 ${report.score}`}>
          <strong>{report.score}</strong>
          <span>阅读分</span>
        </div>
      </div>

      <div className="report-actions">
        <span>
          {redCount} 个红色风险 · {yellowCount} 个黄色提醒 · {formatTextScale(report.wordCount)} · {sourceText(report)}
        </span>
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          报告已更新：{statusText(report.status)}，阅读分 {report.score}，{redCount} 个红色风险，{yellowCount} 个黄色提醒。
        </span>
        <div className="report-share-actions">
          <div className="report-action-buttons">
            <button className="ghost-button" type="button" onClick={copyReport}>
              <ClipboardCheck aria-hidden="true" />
              {copyReportLabel(copyReportState)}
            </button>
            <button className="ghost-button" type="button" onClick={downloadMarkdown}>
              <Download aria-hidden="true" />
              {downloadReportLabel(downloadReportState)}
            </button>
            <button className="ghost-button" type="button" onClick={printCurrentReport}>
              <Printer aria-hidden="true" />
              打印/保存 PDF
            </button>
          </div>
          <p className="report-share-reminder">复制或导出前，请复核证据片段中是否仍有个人信息或敏感条款。</p>
        </div>
      </div>

      {report.notice ? <p className="report-notice">{report.notice}</p> : null}
      {printState === "failed" ? (
        <p className="report-notice" role="alert" aria-live="assertive">
          当前浏览器不支持自动打开打印窗口，请使用浏览器菜单打印。
        </p>
      ) : null}
      {downloadReportState === "failed" ? (
        <div className="report-copy-fallback">
          <span>浏览器没有允许自动下载。可以复制完整 Markdown 报告后手动保存为 .md 文件。</span>
          <textarea ref={downloadFallbackRef} readOnly value={markdownReport} aria-label="完整 Markdown 报告，可手动保存" />
        </div>
      ) : null}
      {copyReportState === "failed" ? (
        <div className="report-copy-fallback">
          <span>浏览器没有允许自动复制。可以在这里手动全选复制完整报告。</span>
          <textarea ref={copyFallbackRef} readOnly value={markdownReport} aria-label="完整 Markdown 报告" />
        </div>
      ) : null}

      <PriorityBrief report={report} />

      <section className="report-section">
        <p className="section-label">风险</p>
        <h3>风险提示</h3>
        <div className="risk-list">
          {report.findings.length ? (
            report.findings.map((finding) => (
              <RiskCard key={finding.id} finding={finding} onRevealEvidence={onRevealEvidence} />
            ))
          ) : (
            <div className="quiet-state">
              <ShieldCheck aria-hidden="true" />
              <div>
                <p>没有命中明显风险规则。</p>
                {coverageBoundaryNotice ? <p>{coverageBoundaryNotice}</p> : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <ClauseEditPack findings={report.findings} />

      <section className="report-section">
        <p className="section-label">事实</p>
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
        <p className="section-label">白话解释</p>
        <h3>给普通人的解释</h3>
        {report.plainLanguage.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <p className="disclaimer">{report.disclaimer}</p>
    </section>
  );
});

function copyReportLabel(state: "idle" | "copied" | "failed"): string {
  if (state === "copied") return "已复制";
  if (state === "failed") return "复制失败";
  return "复制报告";
}

function downloadReportLabel(state: "idle" | "downloaded" | "failed"): string {
  if (state === "downloaded") return "已导出";
  if (state === "failed") return "导出失败";
  return "导出 Markdown";
}

function selectFallbackText(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) return;
  textarea.focus();
  textarea.select();
  try {
    textarea.setSelectionRange(0, textarea.value.length);
  } catch {
    // The visible textarea remains available even if a browser refuses programmatic selection.
  }
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
