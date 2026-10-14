import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'preact/hooks';

import { api } from '../utils/api';
import states from '../utils/states';
import useLocationChange from '../utils/useLocationChange';

import AccountInfo from './account-info';
import Icon from './icon';

function AccountSheet({ account, instance: propInstance, onClose }) {
  const { t } = useLingui();
  const { masto, instance, authenticated } = api({ instance: propInstance });
  const isString = typeof account === 'string';
  const sheetRef = useRef();
  const swipeRef = useRef();

  useEffect(() => {
    if (!isString) {
      states.accounts[`${account.id}@${instance}`] = account;
    }
  }, [account]);

  useLocationChange(onClose);

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    swipeRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollTop:
        sheetRef.current?.querySelector('.account-container')?.scrollTop || 0,
    };
  };

  const handlePointerUp = (e) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;

    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;
    if (Math.abs(deltaY) < 72 || Math.abs(deltaY) < Math.abs(deltaX) * 1.25) {
      return;
    }
    if (start.scrollTop > 2) return;

    if (deltaY > 0) {
      onClose?.();
      return;
    }

    const profileLink = sheetRef.current?.querySelector(
      'header .account-block',
    );
    profileLink?.click();
  };

  return (
    <div
      ref={sheetRef}
      class="sheet account-sheet"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeRef.current = null;
      }}
      // onClick={(e) => {
      //   const accountBlock = e.target.closest('.account-block');
      //   if (accountBlock) {
      //     onClose({
      //       destination: 'account-statuses',
      //     });
      //   }
      // }}
    >
      {!!onClose && (
        <button type="button" class="sheet-close outer" onClick={onClose}>
          <Icon icon="x" alt={t`Close`} />
        </button>
      )}
      <AccountInfo
        instance={instance}
        authenticated={authenticated}
        account={account}
        fetchAccount={async () => {
          if (isString) {
            try {
              const info = await masto.v1.accounts.lookup({
                acct: account,
                skip_webfinger: false,
              });
              return info;
            } catch (e) {
              const result = await masto.v2.search.list({
                q: account,
                type: 'accounts',
                limit: authenticated ? 1 : 11, // Magic number
                resolve: authenticated,
              });
              if (result.accounts.length) {
                const accountWithSameString = result.accounts.find(
                  (a) => a.url === account || account.startsWith(a.url),
                );
                if (accountWithSameString) {
                  return accountWithSameString;
                }
              }
              if (/^https?:\/\/[^/]+\/@[^/]+$/.test(account)) {
                const accountURL = URL.parse(account);
                if (accountURL) {
                  const { hostname, pathname } = accountURL;
                  const acct =
                    pathname.replace(/^\//, '').replace(/\/$/, '') +
                    '@' +
                    hostname;
                  const result = await masto.v2.search.list({
                    q: acct,
                    type: 'accounts',
                    limit: 1,
                    resolve: authenticated,
                  });
                  if (result.accounts.length) {
                    return result.accounts[0];
                  }
                }
              }
            }
          } else {
            return account;
          }
        }}
      />
    </div>
  );
}

export default AccountSheet;
