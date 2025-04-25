// UploadArea.jsx
import { useState } from "react";
import ImagePreview from './ImagePreview';


function UploadArea() {
  const [queuedImages, setQueuedImages] = useState([]);
  const [outputType, setOutputType] = useState("pngs");
  const [modelType, setModelType] = useState("vimeo");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  

  const handleFiles = (files) => {
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image")
    );

    if (newFiles.length == 2) {
      if (newFiles[0].type !== newFiles[1].type) {
        alert("Please upload images of the same type.");
        return;
      }
    }
    if (newFiles.length + queuedImages.length > 2) {
      alert("You can only upload 2 images at a time.");
      return;
    }
    if (queuedImages.length != 0) {
      if (queuedImages[0].type !== newFiles[0].type) {
        alert("Please upload images of the same type.");
        return;
      }
    }

    setQueuedImages((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = (index) => {
    setQueuedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (queuedImages.length != 2) return;

    setSavedImages([]);
    setDownloadUrl(null);
  

    setIsLoading(true);

    const formData = new FormData();
    queuedImages.forEach((image) => {

      formData.append('images', image);
    });

    formData.append('model', modelType);
    formData.append('output', outputType);

    // console.log(formData.getAll('images'));
    // console.log(modelType);
    // console.log(outputType);
  
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
  
      if (outputType === "pngs") {
        
        const data = await response.json();
        // console.log('Received PNGs:', data.images);
        setSavedImages(data.images);
        
      } else {
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
  
        
        setDownloadUrl(url);
      }
  
      setQueuedImages([]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      const response = await fetch('/api/download-pngs');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const a = document.createElement('a');
      a.href = url;
      a.download = 'frames.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading zip:', error);
    }
  };
  
  

  return (
    <main className="max-w-[1224px] w-[92%] mx-auto mt-5 mb-5 flex flex-col gap-4">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[300px] max-w-[600px] flex justify-between items-center">
            <h4 className="text-2xl font-semibold">Model Used</h4>
            <form>
              <select
                className="border-2 border-black rounded p-1"
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
              >
                <option value="vimeo">Vimeo</option>
                <option value="anime">Anime</option>
              </select>
            </form>
          </div>
          <div className="min-w-[300px] max-w-[600px] flex justify-between items-center">
            <h4 className="text-2xl font-semibold">Output Format</h4>
            <form>
              <select
                className="border-2 border-black rounded p-1"
                value={outputType}
                onChange={(e) => setOutputType(e.target.value)}
              >
                <option value="pngs">PNGs</option>
                <option value="gif">gif</option>
                <option value="mp4">MP4</option>
              </select>
            </form>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full h-48 flex justify-center items-center text-center border-2 border-dotted border-black rounded bg-white relative"
      >
        <p>
          Drag & drop images here or{" "} 
          <span className="font-bold text-black">Browse</span>
        </p>
        <input
          type="file"
          multiple
          accept="image/png, image/jpeg, image/jpg, image/heic"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      
      <form onSubmit={handleUpload} className="flex flex-col gap-2">

        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-xl font-semibold">Ready To Upload</h3>
          <button
            type="submit"
            className="p-2 w-20 bg-black text-white rounded shadow hover:opacity-90"
          >
            Upload
          </button>
        </div>

        <div className="w-full min-h-[150px] flex flex-wrap gap-4 border-2 border-dotted border-black bg-white rounded p-2">
            {queuedImages.map((image, index) => (
                <ImagePreview
                key={index}
                image={image}
                onDelete={() => handleDelete(index)}
                />
            ))}
        </div>
      </form>
      {downloadUrl && (
        <div className="mt-4 flex flex-col items-center">
          {outputType === "mp4" && (
            <video controls src={downloadUrl} className="w-1/2" />
          )}
          {outputType === "gif" && (
            <img src={downloadUrl} alt="Generated GIF" className="w-1/2" />
          )}
          <a
            href={downloadUrl}
            download={`output.${outputType}`}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded shadow"
          >
            Download {outputType.toUpperCase()}
          </a>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center mt-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg font-semibold">Processing...</p>
        </div>
      )}

      {savedImages.length > 0 && (
        <div
        className="w-full h-auto flex justify-evenly items-center text-center border-2 border-dotted p-2 mb-4 border-black rounded bg-white relative"
        >
          <div className="flex flex-wrap gap-4">
            {savedImages.map((filename, index) => (
              <img
                key={index}
                src={`http://localhost:3000/output/${filename}?t=${Date.now()}`}
                // src={`http://localhost:3000/output/${filename}`}
                alt={`Saved frame ${index}`}
                className="w-40 h-40 object-cover border"
              />
            ))}
            <button
              onClick={handleDownloadZip}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded shadow"
            >
              Download All PNGs
            </button>
          </div>
        </div>
      )}

    </main>
  );
}

export default UploadArea;
