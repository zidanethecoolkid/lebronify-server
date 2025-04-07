// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/songs', express.static('uploads'));

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Multer config for temp upload
const upload = multer({ dest: 'uploads/' });

// Upload route
app.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    const { title, artist } = req.body;

    if (!file) return res.status(400).send('No file uploaded');

    const fileBuffer = fs.readFileSync(file.path);
    const fileExt = path.extname(file.originalname);
    const supabasePath = `songs/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from('songs')
      .upload(supabasePath, fileBuffer, {
        contentType: file.mimetype,
      });

    fs.unlinkSync(file.path); // remove temp file

    if (error) return res.status(500).json({ error: error.message });

    const { data: publicUrlData } = supabase.storage
      .from('songs')
      .getPublicUrl(supabasePath);

    return res.status(200).json({
      title,
      artist,
      audioUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Something went wrong');
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('LeBronify Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
