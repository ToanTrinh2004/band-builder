export function extractYoutubeVideoId(url: string): string {
  if (!url) return "";
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match?.[1] || "";
}
