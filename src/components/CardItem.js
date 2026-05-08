import { html } from 'https://esm.sh/htm/preact';

export function CardItem({ item, revealed, correct }) {
  return html`
    <div class="card-item">
      <h2 class="question-title">${item.title}</h2>
      ${revealed && html`
        <div class=${correct ? 'answer-revealed correct' : 'answer-revealed incorrect'}>
          <strong>Answer:</strong> ${item.answers[0]}
        </div>
      `}
    </div>
  `;
}
