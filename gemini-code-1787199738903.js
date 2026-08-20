import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: '未提供圖片資料' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
    請分析這張醫療設備標籤照片，白色方框中有三行重要資訊：
    1. 第一行：單位名稱（固定為「輔大」加上後續英文代碼，例如「輔大ER」）
    2. 第二行：定位器編號（剛好 5 位純數字）
    3. 第三行：院內財產編號（剛好 6 位純數字）

    請務必回傳標準 JSON 格式，不要包含任何額外說明文字或 markdown 標籤：
    {
      "unit": "輔大XX",
      "locator_id": "12345",
      "property_id": "123456"
    }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64.split(',')[1] || imageBase64
              }
            }
          ]
        }
      ]
    });

    const text = response.text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}