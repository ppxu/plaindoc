import { Component, type ErrorInfo, type ReactNode } from "react";
import { clearLocalStoredData } from "../state/localDataReset";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("PlainDoc runtime error", error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="app-error-shell" role="alert" aria-labelledby="app-error-title">
        <section className="app-error-panel">
          <p className="app-error-kicker">PlainDoc</p>
          <h1 id="app-error-title">PlainDoc 遇到问题</h1>
          <p>
            当前页面没有正常恢复。你可以先刷新页面；如果问题来自本机保存的数据，可以清除本机数据后重新打开。
          </p>
          <div className="app-error-actions">
            <button type="button" onClick={reloadPage}>
              刷新页面
            </button>
            <button type="button" onClick={clearLocalDataAndReload}>
              清除本机数据并刷新
            </button>
          </div>
          <p className="app-error-note">清除本机数据不会删除离线应用缓存。</p>
        </section>
      </main>
    );
  }
}

function reloadPage() {
  window.location.reload();
}

function clearLocalDataAndReload() {
  clearLocalStoredData();
  window.location.reload();
}
