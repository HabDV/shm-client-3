import { useEffect, useRef, useState } from 'react';
import { Button, Group, Paper, Text, ActionIcon, Transition } from '@mantine/core';
import { IconDownload, IconX, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAPrompt() {
  const { t } = useTranslation();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const newWorkerRef = useRef<ServiceWorker | null>(null);

  // ── Install prompt ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── SW update detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorkerRef.current = newWorker;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShowUpdate(true);
          }
        });
      });
    });

    // Detect controller change (after skipWaiting) → reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setInstallPrompt(null);
  };

  const handleUpdate = () => {
    newWorkerRef.current?.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdate(false);
  };

  // Update banner takes priority
  if (showUpdate) {
    return (
      <Transition mounted={showUpdate} transition="slide-up" duration={300}>
        {(styles) => (
          <Paper
            style={{
              ...styles,
              position: 'fixed',
              bottom: 80,
              left: 16,
              right: 16,
              zIndex: 300,
              padding: '12px 16px',
            }}
            shadow="lg"
            radius="md"
            withBorder
          >
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm" fw={600}>{t('pwa.updateTitle')}</Text>
                <Text size="xs" c="dimmed">{t('pwa.updateDescription')}</Text>
              </div>
              <Group gap="xs" wrap="nowrap">
                <Button
                  size="xs"
                  leftSection={<IconRefresh size={14} />}
                  onClick={handleUpdate}
                >
                  {t('pwa.updateButton')}
                </Button>
                <ActionIcon variant="subtle" size="sm" onClick={() => setShowUpdate(false)}>
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Paper>
        )}
      </Transition>
    );
  }

  if (!showInstall) return null;

  return (
    <Transition mounted={showInstall} transition="slide-up" duration={300}>
      {(styles) => (
        <Paper
          style={{
            ...styles,
            position: 'fixed',
            bottom: 80,
            left: 16,
            right: 16,
            zIndex: 300,
            padding: '12px 16px',
          }}
          shadow="lg"
          radius="md"
          withBorder
        >
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text size="sm" fw={600}>{t('pwa.installTitle')}</Text>
              <Text size="xs" c="dimmed">{t('pwa.installDescription')}</Text>
            </div>
            <Group gap="xs" wrap="nowrap">
              <Button
                size="xs"
                leftSection={<IconDownload size={14} />}
                onClick={handleInstall}
              >
                {t('pwa.installButton')}
              </Button>
              <ActionIcon variant="subtle" size="sm" onClick={() => setShowInstall(false)}>
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Paper>
      )}
    </Transition>
  );
}
