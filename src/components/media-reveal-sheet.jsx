import './media-reveal-sheet.css';

import { Trans, useLingui } from '@lingui/react/macro';

import i18nDuration from '../utils/i18n-duration';
import states from '../utils/states';

const REVEAL_DURATIONS = [
  [300, i18nDuration(5, 'minute')],
  [600, i18nDuration(10, 'minute')],
  [1800, i18nDuration(30, 'minute')],
  [3600, i18nDuration(1, 'hour')],
  [10_800, i18nDuration(3, 'hour')],
];

function MediaRevealSheet({ onClose }) {
  const { _ } = useLingui();

  return (
    <div class="sheet media-reveal-sheet">
      <header>
        <h2>
          <Trans>Show media for</Trans>
        </h2>
      </header>
      <main>
        <div class="actions">
          {REVEAL_DURATIONS.map(([duration, label]) => (
            <button
              type="button"
              class="light"
              onClick={() => {
                const statusID = states.showMediaReveal?.statusId;
                if (statusID) {
                  const expiresAt = Date.now() + duration * 1000;
                  states.spoilersMedia[statusID] = expiresAt;
                  setTimeout(() => {
                    if (states.spoilersMedia[statusID] === expiresAt) {
                      delete states.spoilersMedia[statusID];
                    }
                  }, duration * 1000);
                }
                onClose();
              }}
            >
              {_(label)}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

export default MediaRevealSheet;
