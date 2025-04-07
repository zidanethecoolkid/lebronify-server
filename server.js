// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use('/songs', express.static('uploads'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Upload endpoint
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const { title, artist } = req.body;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileBuffer = fs.readFileSync(file.path);
    const { data, error } = await supabase.storage
      .from('songs') // Make sure this bucket exists in Supabase!
      .upload(`public/${file.filename}`, fileBuffer, {
        contentType: file.mimetype,
      });

    if (error) throw error;

    const publicURL = supabase.storage.from('songs').getPublicUrl(`public/${file.filename}`).data.publicUrl;

    res.json({ title, artist, url: publicURL });
  } catch (err) {
    console.error('Upload failed:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/', (req, res) => {
  res.send('LeBronify Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
