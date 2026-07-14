function base64UrlEncode(bytes: Uint8Array): string {
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary)
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replace(/=+$/u, '')
}

export function createRandomValue(byteLength = 32): string {
	const bytes = new Uint8Array(byteLength)
	crypto.getRandomValues(bytes)
	return base64UrlEncode(bytes)
}

export async function createCodeChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(verifier),
	)
	return base64UrlEncode(new Uint8Array(digest))
}
