export function renderPrompter(promptResult, activeFields, totalFields) {
  const diagnostics = promptResult?.diagnostics || {};
  const words = diagnostics.wordCount || 0;
  const pct = Math.round((activeFields / Math.max(totalFields, 1)) * 100);

  return `
    <div class="word-bar" style="margin-bottom:var(--sp-3);">
      <div class="word-bar__fill" style="width:${pct}%;background:var(--state-success)"></div>
    </div>
    <div class="word-stats">
      <span>${activeFields}/${totalFields} fields</span>
      <span>${words} words</span>
    </div>
    <div class="prompt-panel" style="margin-top:var(--sp-3);">
      <div class="prompt-panel__label">Positive</div>
      <div class="prompt-text">${promptResult?.positivePrompt || 'Start selecting fields to build your prompt.'}</div>
      <div class="prompt-panel__label" style="margin-top:var(--sp-3);">Negative</div>
      <div class="prompt-text prompt-text--negative">${promptResult?.negativePrompt || '(empty)'}</div>
    </div>
  `;
}
