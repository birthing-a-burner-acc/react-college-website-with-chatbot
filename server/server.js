import 'dotenv/config';
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import pdf from '@cedrugs/pdf-parse';
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CORS_ORIGIN 
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and TXT files are allowed'));
  },
});

const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(mongoUrl);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

(async () => {
  await client.connect();
  const db = client.db('college_enquiry');
  const faqsCollection = db.collection('faqs');
  const documentsCollection = db.collection('documents');

  await faqsCollection.createIndex({ question: 'text', answer: 'text' });
  await documentsCollection.createIndex({ content: 'text' });

  app.get('/api/faqs', async (req, res) => {
    const faqs = await faqsCollection.find({}).toArray();
    res.json(faqs);
  });

  app.post('/api/faqs', async (req, res) => {
    const result = await faqsCollection.insertOne(req.body);
    res.status(201).json(result);
  });

  app.delete('/api/faqs/:id', async (req, res) => {
    await faqsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
  });

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      let extractedText = '';

      if (req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        extractedText = data.text;
      } else {
        // TXT file
        extractedText = req.file.buffer.toString('utf-8');
      }

      if (!extractedText.trim()) {
        return res.status(400).json({ error: 'No readable text found in file' });
      }

      const chunks = chunkText(extractedText, 500, 50);
      const docsToInsert = chunks.map((chunk, index) => ({
        source: req.file.originalname,
        chunk_index: index,
        content: chunk,
        uploaded_at: new Date(),
      }));

      await documentsCollection.insertMany(docsToInsert);

      res.status(201).json({
        message: `Uploaded ${req.file.originalname}`,
        chunks: chunks.length,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/documents', async (req, res) => {
    const docs = await documentsCollection
      .aggregate([
        {
          $group: {
            _id: '$source',
            chunks: { $sum: 1 },
            uploaded_at: { $first: '$uploaded_at' },
          },
        },
      ])
      .toArray();
    res.json(docs);
  });

  app.delete('/api/documents/:source', async (req, res) => {
    await documentsCollection.deleteMany({ source: req.params.source });
    res.status(204).send();
  });

app.post('/api/chat', async (req, res) => {
  try {

    let userQuery = '';

    if (req.body.messages && Array.isArray(req.body.messages)) {
      const userMessages = req.body.messages.filter((m) => m.role === 'user');
      if (userMessages.length > 0) {
        userQuery = userMessages[userMessages.length - 1].text;
      }
    } else if (req.body.message) {
      userQuery = req.body.message;
    }

    if (!userQuery || !userQuery.trim()) {
      console.log('Empty query received. Body was:', JSON.stringify(req.body));
      return res.json({ text: 'Please ask a question so I can help you.' });
    }

    const faqResult = await faqsCollection.findOne(
      { $text: { $search: userQuery } },
      { score: { $meta: 'textScore' } }
    );

    const docResults = await documentsCollection
      .find(
        { $text: { $search: userQuery } },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .toArray();

    let context = '';
    if (faqResult) {
      context += `FAQ:\nQ: ${faqResult.question}\nA: ${faqResult.answer}\n\n`;
    }
    if (docResults.length > 0) {
      context += 'Relevant document excerpts:\n';
      docResults.forEach((doc) => {
        context += `[From ${doc.source}]\n${doc.content}\n\n`;
      });
    }
    if (!context) {
      context = 'No relevant information found in the college knowledge base.';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: userQuery,
      config: {
        systemInstruction: `You are a helpful and polite college enquiry assistant.
Use ONLY the following context to answer the user's question.
If the context does not contain the answer, politely say you don't have that information.
Do not make up information.

CONTEXT:
${context}`,
      },
    });

    res.json({
      text: response.text,
    });
  } catch (error) {
    res.json({
      text: "I'm having trouble processing that right now. Please try again later.",
    });
  }
});

  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
})();
