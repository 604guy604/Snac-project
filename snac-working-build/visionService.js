const VISION_API_URL = process.env.EXPO_PUBLIC_VISION_API_URL ?? '';

function buildUnavailableResponse() {
  return {
    status: 'unavailable',
    message: 'Vision backend not configured. Set EXPO_PUBLIC_VISION_API_URL to enable photo inference.',
    candidates: [],
  };
}

function getFileInfo(uri) {
  const name = uri.split('/').pop() || 'photo.jpg';
  const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';
  return { uri, name, type };
}

export async function analyzeTrackPhoto(uri) {
  if (!uri) {
    throw new Error('No photo URI provided');
  }

  if (!VISION_API_URL) {
    return buildUnavailableResponse();
  }

  const formData = new FormData();
  formData.append('photo', getFileInfo(uri));

  const response = await fetch(VISION_API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Vision API failed with status ${response.status}`);
  }

  const result = await response.json();
  return {
    status: 'success',
    message: result.message ?? 'Vision analysis complete',
    candidates: Array.isArray(result.candidates) ? result.candidates : [],
    raw: result,
  };
}
