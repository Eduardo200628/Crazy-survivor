export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), 1600);
  });
}

export function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 800);
  });
}