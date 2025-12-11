// src/utils/brfExporter.ts
// Grade 1 BRF exporter (exportTranscriptToBRF)

/**
 * Export transcript to a .brf file (Grade 1 Braille ASCII approximation).
 * - Wraps lines to 40 characters.
 * - Produces a small human-readable header + converted content.
 */
export const exportTranscriptToBRF = async (transcript: any) => {
	try {
		const content = convertTranscriptToBRF(transcript);
		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${(transcript.title || "transcript").replace(/[^a-z0-9-_ ]/gi, "_")}.brf`;
		a.click();

		URL.revokeObjectURL(url);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error("BRF export failed:", err);
		alert("Failed to export BRF file.");
	}
};

const convertTranscriptToBRF = (transcript: any): string => {
	const header = `Transvero Transcript Export (BRF)\nGenerated: ${new Date().toISOString()}\n----------------------------------------\n\n`;
	const text = (transcript?.content || "").toString();
	const normalized = formatWithTimestamps(text);
	const braille = convertToGrade1Braille(normalized);
	const wrapped = wrap40(braille);
	return header + wrapped;
};

const formatWithTimestamps = (content: string) => {
	// Normalize line endings; keep timestamps if present.
	return content.replace(/\r\n/g, "\n");
};

// Very small Grade 1 braille approximation mapping to BRF-friendly ASCII.
// This is intentionally conservative — unsupported chars are removed.
const convertToGrade1Braille = (text: string) => {
	const map: Record<string, string> = {
		a: "a", b: "b", c: "c", d: "d", e: "e",
		f: "f", g: "g", h: "h", i: "i", j: "j",
		k: "k", l: "l", m: "m", n: "n", o: "o",
		p: "p", q: "q", r: "r", s: "s", t: "t",
		u: "u", v: "v", w: "w", x: "x", y: "y", z: "z",

		// numbers: use # followed by a-j per BRF
		"1": "#a", "2": "#b", "3": "#c", "4": "#d", "5": "#e",
		"6": "#f", "7": "#g", "8": "#h", "9": "#i", "0": "#j",

		// punctuation passthrough (simple)
		".": ".", ",": ",", "?": "?", "!": "!", ":": ":", ";": ";",
		"-": "-", "'": "'", '"': '"', "(": "(", ")": ")",
		" ": " ", "\n": "\n",
	};

	let out = "";
	for (const ch of text.toLowerCase()) {
		if (map[ch] !== undefined) out += map[ch];
		// else: drop unsupported characters (accents, control chars, emoji)
	}
	return out;
};

const wrap40 = (text: string) => {
	const lines = text.split("\n");
	const res: string[] = [];
	for (let line of lines) {
		// trim trailing spaces
		line = line.replace(/[\s]+$/g, "");
		while (line.length > 40) {
			res.push(line.slice(0, 40));
			line = line.slice(40);
		}
		res.push(line);
	}
	return res.join("\n") + "\n";
};

