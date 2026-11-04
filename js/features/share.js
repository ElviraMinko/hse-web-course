async function copyText(text) {
  if (!navigator.clipboard || !window.isSecureContext) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareLink(data) {
  const canShare = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data));
  if (canShare) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(data.url)) ? 'copied' : 'failed';
}
