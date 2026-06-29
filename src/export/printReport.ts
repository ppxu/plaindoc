interface PrintableWindow {
  print?: () => void;
}

export function printReport(target: PrintableWindow = globalThis): boolean {
  if (typeof target.print !== "function") {
    return false;
  }

  target.print();
  return true;
}
