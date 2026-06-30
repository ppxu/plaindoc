interface PrintableWindow {
  print?: () => void;
}

export function printReport(target: PrintableWindow = globalThis): boolean {
  if (typeof target.print !== "function") {
    return false;
  }

  try {
    target.print();
    return true;
  } catch {
    return false;
  }
}
