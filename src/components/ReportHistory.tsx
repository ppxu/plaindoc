import { Clock3, Trash2 } from "lucide-react";
import type { SavedReport } from "../types";

interface ReportHistoryProps {
  items: SavedReport[];
  onSelect: (item: SavedReport) => void;
  onClear: () => void;
}

export function ReportHistory({ items, onSelect, onClear }: ReportHistoryProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="report-history" aria-label="Recent local reports">
      <div className="history-heading">
        <span>
          <Clock3 aria-hidden="true" />
          最近报告
        </span>
        <button type="button" onClick={onClear} aria-label="清空本地报告历史">
          <Trash2 aria-hidden="true" />
        </button>
      </div>

      <div className="history-list">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item)} className="history-item">
            <strong>{item.title}</strong>
            <span>{formatDate(item.createdAt)} · {sourceLabel(item.report)}</span>
          </button>
        ))}
      </div>
      <p>历史只保存在本机浏览器，保存报告不保存原始正文。</p>
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function sourceLabel(report: SavedReport["report"]): string {
  if (report.source === "model") {
    return report.modelName ? `AI 增强：${report.modelName}` : "AI 增强";
  }
  return "本地规则";
}
