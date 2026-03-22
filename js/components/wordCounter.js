export function renderWordCounter(promptResult, activeFields, totalFields) {
  const words = promptResult?.diagnostics?.wordCount || 0;
  const pct = Math.min(100, Math.round((words / 140) * 100));
  const color = words <= 80 ? 'var(--state-success)' : words <= 110 ? 'var(--state-warning)' : 'var(--state-error)';
  const strength = Math.round((activeFields / Math.max(totalFields, 1)) * 100);

  return `
    <div class="word-bar" style="margin-bottom:var(--sp-1);">
      <div class="word-bar__fill" style="width:${pct}%;background:${color}"></div>
    </div>
    <div class="word-stats">
      <span><strong>${words}</strong> words</span>
      <span>${activeFields}/${totalFields} fields · ${strength}%</span>
    </div>
  `;
}
