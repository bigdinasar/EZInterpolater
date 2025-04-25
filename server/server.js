// server/server.js
import { exec } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import multer from 'multer'
import cors from 'cors'
import sharp from 'sharp';
import { createReadStream } from 'fs'
import * as fsSync from 'fs';         
import * as fs from 'fs/promises'; 
import archiver from 'archiver';
import util from 'util';

const runCommand = util.promisify(exec);

const app = express()
const PORT = 3000


app.use(cors())


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname) 
  }
})

async function clearOutputFolder() {
  console.log("in clearOutputFolder");
  const outputDir = path.join(__dirname, 'output');

  try {
    const files = (await fs.readdir(outputDir)).filter(file => !file.endsWith('.png'));
    for (const file of files) {
      console.log(`Deleting file: ${file}`);
      await fs.unlink(path.join(outputDir, file));
    }
    console.log("Output folder cleared.");
  } catch (err) {
    console.error('Error clearing output folder:', err);
  }
}


const resizeIfNeeded = async (filePath, maxWidth = 600, maxHeight = 600) => {
  console.log("in resizeIfNeeded");
  console.log("filePath:", filePath);
  const image = sharp(filePath);

  const metadata = await image.metadata();
  

  if (metadata.width > maxWidth || metadata.height > maxHeight) {
    const tempPath = filePath.replace(/(\.\w+)$/, '_resized$1');
    

    await image
      .resize({ width: maxWidth, height: maxHeight, fit: 'inside' })
      .toFile(tempPath);
    

   
    await fs.rename(tempPath, filePath);

    console.log(`Resized ${filePath} to max ${maxWidth}x${maxHeight}`);
  } else {
    console.log(`No resize needed for ${filePath}`);
  }
};

const upload = multer({ storage: storage })


app.get('/api/download-pngs', (req, res) => {
  
  const outputDir = path.join(__dirname, 'output');
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=frames.zip');

  const archive = archiver('zip', {
    zlib: { level: 9 } 
  });

  archive.pipe(res);
  archive.directory(outputDir, false); 
  archive.finalize();
});

app.post('/api/upload', upload.array('images'), async (req, res) => {
  
  await clearOutputFolder();
  // console.log("Cleared output folder.");

  const { model, output } = req.body
  const files = req.files

  // console.log('Files:', files)
  // console.log('file[0]:', files[0])
  // console.log('file[1]:', files[1])

  if (!files || files.length < 2) {
    return res.status(400).json({ error: 'Two images are required.' })
  }
  
  const img1 = files[0].filename
  const img2 = files[1].filename

  console.log('img1:', img1)
  console.log('img2:', img2)
  if (img1.endsWith('.png')){
    const imgType = "png"
    // console.log('imgType:', imgType)
  } else {
    const imgType = "other type"
    // console.log('imgType:', imgType)
  }

  

  
  let modelParam = ''
  if (model === 'anime') {
    modelParam = 'anime_log'
  } else if (model === 'vimeo') {
    modelParam = 'train_log'
  } else {
    return res.status(400).json({ error: 'Invalid model type.' })
  }

  try {

    await resizeIfNeeded(path.join(__dirname, 'uploads', img1));
    await resizeIfNeeded(path.join(__dirname, 'uploads', img2));
    console.log('Resized images if needed.');
    

    const pythonCommand = `python3 inference_img.py --img uploads/${img1} uploads/${img2} --exp=4 --model=${modelParam}`;
    console.log('Running:', pythonCommand);

    
    const { stdout: pythonOutput } = await runCommand(pythonCommand);
    console.log('Python Output:', pythonOutput);

    if (output === 'mp4') {
      console.log('output: ', output);
      const ffmpegCommand = `ffmpeg -r 24 -i output/img%d.png -vcodec libx264 output/output.mp4`;
      console.log('ffmpegCommand: ', ffmpegCommand);
      const { stdout: mp4Out } = await runCommand(ffmpegCommand);
      console.log('FFmpeg MP4 Output:', mp4Out);

      
      const filePath = path.join(__dirname, 'output/output.mp4');
      res.setHeader('Content-Type', 'video/mp4');
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
      res.on('finish', () => {
        console.log('MP4 sent. Cleaning up...');
        clearOutputFolder();
      });

    } else if (output === 'gif') {
      // console.log('output: ', output);
      const ffmpegCommand = `ffmpeg -r 24 -i output/img%d.png output/output.gif`;
      const { stdout: gifOut } = await runCommand(ffmpegCommand);
      // console.log('FFmpeg GIF Output:', gifOut);

      
      const filePath = path.join(__dirname, 'output/output.gif');
      res.setHeader('Content-Type', 'image/gif');
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
      res.on('finish', () => {
        console.log('GIF sent. Cleaning up...');
        clearOutputFolder();
      });

    } else if (output === 'pngs') {
      const files = fsSync.readdirSync(path.join(__dirname, 'output'))
        .filter(file => file.endsWith('.png'));

      res.json({ images: files });

    } else {
      return res.status(400).json({ error: 'Invalid output type.' });
    }

  } catch (err) {
    console.error('Command execution failed:', err.message);
    return res.status(500).json({ error: 'Failed to complete processing.' });
  }
});




app.use('/uploads', express.static('uploads'))
app.use('/output', express.static('output'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

