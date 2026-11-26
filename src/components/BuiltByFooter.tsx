// Minimal credit line shown at the bottom of the app.
export function BuiltByFooter() {
  return (
    <footer className="w-full px-4 pb-4 text-center print:hidden sm:px-6 lg:px-8">
      <p className="text-xs text-muted-foreground">
        <span aria-hidden="true">•</span> Built by{' '}
        <span className="font-medium text-primary">
          DAFISTECH <span aria-hidden="true">↗</span>
        </span>
      </p>
    </footer>
  );
}
