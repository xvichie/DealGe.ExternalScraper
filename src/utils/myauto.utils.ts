export function extractMyAutoProductId(url: string): string {
    console.log(url)
  const match = url.match(/\/pr\/(\d+)/);
  if (!match) {
    throw new Error("Invalid MyAuto URL");
  }
  return match[1];
}

