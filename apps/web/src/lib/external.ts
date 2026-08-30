import { isNative } from './platform'

/** Abre una URL externa: navegador del sistema en nativo, pestaña nueva en web. */
export async function openExternal(url: string): Promise<void> {
  if (isNative) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
