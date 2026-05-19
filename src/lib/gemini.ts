export interface GenerationResult {
  donorId: string;
  subject: string;
  emailBody: string;
  smsBody: string;
  callPoints: string;
}

export async function generateMessages(campaign: any, donors: any[]): Promise<GenerationResult[]> {
  const response = await fetch('/api/generate-messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaign, donors }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate messages');
  }

  return response.json();
}
