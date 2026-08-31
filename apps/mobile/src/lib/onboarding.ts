import { getItem, setItem } from './storage'

const ONBOARDING_KEY = 'fb.onboardingSeen.v1'

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await getItem(ONBOARDING_KEY)) === '1'
}

export async function markOnboardingSeen(): Promise<void> {
  await setItem(ONBOARDING_KEY, '1')
}
