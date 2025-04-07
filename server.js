require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Setup Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Multer config
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload route
app.post('/upload', upload.single('audio'), async (req, res) => {
  const file = req.file;
  const { title, artist } = req.body;

  if (!file) return res.status(400).send('No file uploaded');

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('songs') // Make sure this bucket exists in Supabase
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) return res.status(500).send(error.message);

  const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/songs/${fileName}`;

  res.json({
    title,
    artist,
    fileUrl: publicURL,
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('LeBronify Server is running with Supabase!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
