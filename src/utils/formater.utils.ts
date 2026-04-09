export function formatEngineSize(cc: number): string {
  return (cc / 1000).toString().replace(/\.0$/, "")
}

export function parseBidCarsDate(text: string): Date | null {

    try {

        // remove weekday
        const cleaned = text.replace(/^[A-Za-z]{3}\s/, "");

        // "26 March, 2026"
        const parsed = new Date(cleaned);

        if (isNaN(parsed.getTime()))
            return null;

        return parsed;

    } catch {
        return null;
    }
}