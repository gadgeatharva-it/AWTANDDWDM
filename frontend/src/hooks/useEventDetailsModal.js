import { useCallback, useMemo, useState } from 'react';

export function useEventDetailsModal() {
  const [open, setOpen] = useState(false);
  const [event, setEvent] = useState(null);

  const openForEvent = useCallback((nextEvent) => {
    if (!nextEvent) return;
    setEvent(nextEvent);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEvent(null);
  }, []);

  const modalProps = useMemo(() => ({
    open,
    event,
    onClose: close,
  }), [close, event, open]);

  return {
    open,
    event,
    openForEvent,
    close,
    modalProps,
  };
}

