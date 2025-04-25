// src/components/ImagePreview.jsx
function ImagePreview({ image, onDelete }) {
    return (
      <div className="relative h-[150px] w-[150px] rounded shadow overflow-hidden">
        <img
          src={URL.createObjectURL(image)}
          alt="uploaded"
          className="object-cover h-full w-full"
        />
        <span
          onClick={onDelete}
          className="absolute top-0 right-2 text-white text-2xl cursor-pointer hover:opacity-80"
        >
          &times;
        </span>
      </div>
    );
  }
  
  export default ImagePreview;
  